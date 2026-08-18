import { db } from '@/lib/db/db';
import { encryptFileBuffer } from '@/lib/crypto/encryption';
import { decryptFileBuffer } from '@/lib/crypto/decryption';
import { computeFileHash, base64ToBuffer, bufferToBase64 } from '@/lib/crypto/cryptoUtils';
import { DocumentRecord } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Combines 12-byte raw IV and encrypted ciphertext into a single self-contained ArrayBuffer
 * for cloud storage: [ 12-byte IV ][ AES-GCM Ciphertext ]
 */
function packIvAndCiphertext(ivBase64: string, ciphertextBuffer: ArrayBuffer): ArrayBuffer {
  const ivBuffer = base64ToBuffer(ivBase64);
  const combined = new Uint8Array(ivBuffer.byteLength + ciphertextBuffer.byteLength);
  combined.set(new Uint8Array(ivBuffer), 0);
  combined.set(new Uint8Array(ciphertextBuffer), ivBuffer.byteLength);
  return combined.buffer;
}

/**
 * Unpacks self-contained cloud payload into ivBase64 and encrypted ciphertext ArrayBuffer
 */
function unpackIvAndCiphertext(packedBuffer: ArrayBuffer): { ivBase64: string; ciphertextBuffer: ArrayBuffer } {
  const packedArray = new Uint8Array(packedBuffer);
  const ivArray = packedArray.slice(0, 12);
  const ciphertextArray = packedArray.slice(12);

  const ivBuffer = ivArray.buffer.slice(ivArray.byteOffset, ivArray.byteOffset + ivArray.byteLength);
  const ciphertextBuffer = ciphertextArray.buffer.slice(ciphertextArray.byteOffset, ciphertextArray.byteOffset + ciphertextArray.byteLength);

  return {
    ivBase64: bufferToBase64(ivBuffer),
    ciphertextBuffer
  };
}

export async function uploadDocumentService({
  file,
  title,
  categoryId,
  tags,
  expiryDate,
  key,
  userId
}: {
  file: File;
  title: string;
  categoryId: string;
  tags: string[];
  expiryDate?: string;
  key: CryptoKey;
  userId?: string;
}): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const docId = window.crypto.randomUUID();
    const arrayBuffer = await file.arrayBuffer();

    // 1. Compute file hash for duplicate detection
    const contentHash = await computeFileHash(arrayBuffer);

    // 2. Client-side AES-GCM encryption in browser
    const { encryptedBuffer, iv } = await encryptFileBuffer(arrayBuffer, key);

    const now = new Date().toISOString();
    const storagePath = `${userId || 'local'}/${docId}/encrypted.bin`;

    // 3. Save encrypted binary blob locally in IndexedDB
    await db.cachedFiles.put({
      id: docId,
      encryptedBlob: encryptedBuffer,
      iv,
      mimeType: file.type || 'application/octet-stream',
      updatedAt: now
    });

    // 4. Create metadata record locally in IndexedDB
    const documentRecord: DocumentRecord = {
      id: docId,
      userId: userId || 'local',
      title: title || file.name,
      categoryId: categoryId || 'cat_other',
      tags,
      storagePath,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      encryptionVersion: 1,
      createdAt: now,
      updatedAt: now,
      localAvailable: true,
      syncStatus: isSupabaseConfigured ? 'pending' : 'synced',
      isEncrypted: true,
      expiryDate,
      contentHash
    };

    await db.documents.put(documentRecord);

    // 5. If Supabase is configured & online, upload packed payload [ 12-byte IV ][ Ciphertext ]
    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const packedPayload = packIvAndCiphertext(iv, encryptedBuffer);
        const encryptedBlob = new Blob([packedPayload], { type: 'application/octet-stream' });

        const { error: storageError } = await supabase.storage
          .from('documents')
          .upload(storagePath, encryptedBlob, { contentType: 'application/octet-stream', upsert: true });

        if (!storageError) {
          const { error: dbError } = await supabase
            .from('documents')
            .upsert({
              id: docId,
              user_id: userId,
              title: documentRecord.title,
              category_id: documentRecord.categoryId,
              tags: documentRecord.tags,
              storage_path: storagePath,
              mime_type: documentRecord.mimeType,
              file_size: documentRecord.fileSize,
              encryption_version: 1,
              created_at: now,
              updated_at: now
            });

          if (!dbError) {
            await db.documents.update(docId, { syncStatus: 'synced' });
          }
        }
      } catch (cloudErr) {
        console.warn('Cloud sync deferred to offline queue:', cloudErr);
      }
    }

    return { success: true, documentId: docId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error processing document upload' };
  }
}

/**
 * Retrieves a temporary decrypted Blob URL for viewing or downloading.
 * Caller MUST call URL.revokeObjectURL(url) when preview modal is closed!
 */
export async function getDecryptedDocumentBlobUrl(
  docId: string,
  key: CryptoKey
): Promise<{ url?: string; mimeType?: string; error?: string }> {
  try {
    let cached = await db.cachedFiles.get(docId);
    let docRecord = await db.documents.get(docId);

    if (!docRecord) {
      return { error: 'Document record not found.' };
    }

    // If file is missing locally, download self-contained binary from Supabase Storage
    if (!cached && isSupabaseConfigured && navigator.onLine) {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(docRecord.storagePath);

      if (error || !data) {
        return { error: 'Document binary unavailable offline. Connect to internet once to download.' };
      }

      const packedBuffer = await data.arrayBuffer();
      const { ivBase64, ciphertextBuffer } = unpackIvAndCiphertext(packedBuffer);

      // Save unpacked payload in local IndexedDB for future offline viewing
      cached = {
        id: docId,
        encryptedBlob: ciphertextBuffer,
        iv: ivBase64,
        mimeType: docRecord.mimeType,
        updatedAt: new Date().toISOString()
      };

      await db.cachedFiles.put(cached);
      await db.documents.update(docId, { localAvailable: true });
    }

    if (!cached || !cached.iv) {
      return { error: 'Document binary is not available on this device.' };
    }

    // Decrypt in memory
    const decryptedBuffer = await decryptFileBuffer(cached.encryptedBlob, cached.iv, key);
    const blob = new Blob([decryptedBuffer], { type: cached.mimeType || docRecord.mimeType });
    const url = URL.createObjectURL(blob);

    return { url, mimeType: cached.mimeType || docRecord.mimeType };
  } catch (err: any) {
    return { error: err.message || 'Failed to decrypt document' };
  }
}

export async function deleteDocumentService(docId: string): Promise<boolean> {
  try {
    const docRecord = await db.documents.get(docId);
    await db.documents.delete(docId);
    await db.cachedFiles.delete(docId);

    if (docRecord && isSupabaseConfigured && navigator.onLine) {
      await supabase.from('documents').delete().eq('id', docId);
      await supabase.storage.from('documents').remove([docRecord.storagePath]);
    }
    return true;
  } catch {
    return false;
  }
}
