import { db } from '@/lib/db/db';
import { encryptFileBuffer } from '@/lib/crypto/encryption';
import { decryptFileBuffer } from '@/lib/crypto/decryption';
import { computeFileHash } from '@/lib/crypto/cryptoUtils';
import { DocumentRecord } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

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

    // 5. If Supabase is configured & online, attempt cloud upload
    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
        
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

    // If file is missing locally, attempt download from Supabase Storage if online
    if (!cached && isSupabaseConfigured && navigator.onLine) {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(docRecord.storagePath);

      if (error || !data) {
        return { error: 'Document binary unavailable offline. Please reconnect to internet.' };
      }

      const downloadedBuffer = await data.arrayBuffer();
      // Store in local IndexedDB for future offline viewing
      cached = {
        id: docId,
        encryptedBlob: downloadedBuffer,
        iv: '', // Note: if IV is stored in metadata or payload
        mimeType: docRecord.mimeType,
        updatedAt: new Date().toISOString()
      };
    }

    if (!cached) {
      return { error: 'Document is not available offline on this device.' };
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
