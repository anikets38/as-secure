import { db } from '@/lib/db/db';
import { deriveVaultKey } from '@/lib/crypto/keyDerivation';
import { encryptFileBuffer } from '@/lib/crypto/encryption';
import { decryptFileBuffer } from '@/lib/crypto/decryption';
import { bufferToBase64, base64ToBuffer } from '@/lib/crypto/cryptoUtils';

export interface VaultBackupBundle {
  version: number;
  appName: 'AS Secure';
  exportedAt: string;
  documents: any[];
  categories: any[];
  settings: any;
  cachedFiles: Array<{
    id: string;
    encryptedBlobBase64: string;
    iv: string;
    mimeType: string;
    updatedAt: string;
  }>;
}

export async function exportEncryptedVaultBackup(
  backupPassword: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    // 1. Gather all local data from IndexedDB
    const documents = await db.documents.toArray();
    const categories = await db.categories.toArray();
    const settings = await db.settings.toArray();
    const cachedFilesRaw = await db.cachedFiles.toArray();

    // Convert ArrayBuffers in cachedFiles to Base64 for JSON serialization
    const cachedFiles = cachedFilesRaw.map(file => ({
      id: file.id,
      encryptedBlobBase64: bufferToBase64(file.encryptedBlob),
      iv: file.iv,
      mimeType: file.mimeType,
      updatedAt: file.updatedAt
    }));

    const rawBundle: VaultBackupBundle = {
      version: 1,
      appName: 'AS Secure',
      exportedAt: new Date().toISOString(),
      documents,
      categories,
      settings,
      cachedFiles
    };

    // 2. Serialize bundle to JSON Text
    const jsonText = JSON.stringify(rawBundle);
    const encoder = new TextEncoder();
    const jsonBuffer = encoder.encode(jsonText).buffer;

    // 3. Derive key from backup password & encrypt bundle
    const { key, salt } = await deriveVaultKey(backupPassword);
    const { encryptedBuffer, iv } = await encryptFileBuffer(jsonBuffer, key);

    // 4. Create wrapper container file
    const container = {
      format: 'AS_SECURE_BACKUP_V1',
      salt,
      iv,
      encryptedData: bufferToBase64(encryptedBuffer)
    };

    const containerJson = JSON.stringify(container, null, 2);
    const blob = new Blob([containerJson], { type: 'application/json' });
    const filename = `as-secure-backup-${new Date().toISOString().split('T')[0]}.assecure`;

    // Trigger download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);

    return { success: true, filename };
  } catch (err: any) {
    return { success: false, error: err.message || 'Backup export failed' };
  }
}

export async function restoreEncryptedVaultBackup(
  file: File,
  backupPassword: string
): Promise<{ success: boolean; restoredDocCount?: number; error?: string }> {
  try {
    const text = await file.text();
    const container = JSON.parse(text);

    if (container.format !== 'AS_SECURE_BACKUP_V1' || !container.salt || !container.iv) {
      return { success: false, error: 'Invalid or unsupported .assecure backup file format.' };
    }

    // Derive key from backup password using backup salt
    const { key } = await deriveVaultKey(backupPassword, container.salt);
    const encryptedBuffer = base64ToBuffer(container.encryptedData);

    // Decrypt backup payload
    const decryptedBuffer = await decryptFileBuffer(encryptedBuffer, container.iv, key);
    const decoder = new TextDecoder();
    const jsonText = decoder.decode(decryptedBuffer);

    const bundle: VaultBackupBundle = JSON.parse(jsonText);

    if (bundle.appName !== 'AS Secure' || !Array.isArray(bundle.documents)) {
      return { success: false, error: 'Corrupted backup data structure.' };
    }

    // Restore IndexedDB records
    if (bundle.documents.length > 0) {
      await db.documents.bulkPut(bundle.documents);
    }

    if (bundle.categories?.length > 0) {
      await db.categories.bulkPut(bundle.categories);
    }

    if (bundle.cachedFiles?.length > 0) {
      const restoredCachedFiles = bundle.cachedFiles.map(cf => ({
        id: cf.id,
        encryptedBlob: base64ToBuffer(cf.encryptedBlobBase64),
        iv: cf.iv,
        mimeType: cf.mimeType,
        updatedAt: cf.updatedAt
      }));
      await db.cachedFiles.bulkPut(restoredCachedFiles);
    }

    return { success: true, restoredDocCount: bundle.documents.length };
  } catch (err: any) {
    return { success: false, error: err.message || 'Incorrect password or backup corrupted.' };
  }
}
