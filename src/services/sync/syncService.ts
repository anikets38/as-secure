import { db } from '@/lib/db/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DocumentRecord } from '@/types';

/**
 * Synchronizes user document metadata between Supabase Postgres and local IndexedDB.
 * Called automatically when opening Dashboard/Documents page or coming online.
 */
export async function syncCloudDocumentMetadata(userId: string): Promise<{
  syncedCount: number;
  error?: string;
}> {
  if (!isSupabaseConfigured || !navigator.onLine || !userId) {
    return { syncedCount: 0 };
  }

  try {
    // 1. Fetch all cloud document metadata for this user from Supabase Postgres
    const { data: cloudDocs, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase metadata fetch error:', error);
      return { syncedCount: 0, error: error.message };
    }

    if (!cloudDocs) {
      return { syncedCount: 0 };
    }

    const cloudDocMap = new Map(cloudDocs.map(c => [c.id, c]));
    let syncedCount = 0;

    // 2. Reconcile each cloud document record into local IndexedDB
    for (const cloudDoc of cloudDocs) {
      const cachedFile = await db.cachedFiles.get(cloudDoc.id);

      const reconciledRecord: DocumentRecord = {
        id: cloudDoc.id,
        userId: cloudDoc.user_id,
        title: cloudDoc.title || 'Untitled Document',
        categoryId: cloudDoc.category_id || 'cat_other',
        tags: cloudDoc.tags || [],
        storagePath: cloudDoc.storage_path,
        mimeType: cloudDoc.mime_type || 'application/octet-stream',
        fileSize: Number(cloudDoc.file_size) || 0,
        encryptionVersion: cloudDoc.encryption_version || 1,
        createdAt: cloudDoc.created_at,
        updatedAt: cloudDoc.updated_at,
        localAvailable: Boolean(cachedFile),
        syncStatus: 'synced',
        isEncrypted: true
      };

      await db.documents.put(reconciledRecord);
      syncedCount++;
    }

    // 3. Purge all local IndexedDB document records that do NOT exist in Cloud Postgres
    const allLocalDocs = await db.documents.toArray();
    for (const localDoc of allLocalDocs) {
      if (!cloudDocMap.has(localDoc.id) && localDoc.syncStatus === 'synced') {
        await db.documents.delete(localDoc.id);
        await db.cachedFiles.delete(localDoc.id);
      }
    }

    return { syncedCount };
  } catch (err: any) {
    return { syncedCount: 0, error: err.message };
  }
}
