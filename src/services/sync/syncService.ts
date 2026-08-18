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

    if (!cloudDocs || cloudDocs.length === 0) {
      return { syncedCount: 0 };
    }

    let syncedCount = 0;

    // Create a map of existing local documents to identify what to delete
    const localDocMap = new Map((await db.documents.where('userId').equals(userId).toArray()).map(d => [d.id, d]));

    // 2. Reconcile each cloud document record with local IndexedDB
    for (const cloudDoc of cloudDocs) {
      localDocMap.delete(cloudDoc.id);
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
        localAvailable: Boolean(cachedFile), // true if encrypted blob is cached on this device
        syncStatus: 'synced',
        isEncrypted: true
      };

      await db.documents.put(reconciledRecord);
      syncedCount++;
    }

    // Delete any local documents that no longer exist in Cloud (stale duplicates)
    for (const [staleId] of localDocMap.entries()) {
      await db.documents.delete(staleId);
      await db.cachedFiles.delete(staleId);
    }

    // 3. Process any pending local upload items in queue
    const pendingDocs = await db.documents
      .where('syncStatus')
      .equals('pending')
      .toArray();

    for (const pendingDoc of pendingDocs) {
      const cachedFile = await db.cachedFiles.get(pendingDoc.id);
      if (cachedFile) {
        const encryptedBlob = new Blob([cachedFile.encryptedBlob], { type: 'application/octet-stream' });
        const { error: uploadErr } = await supabase.storage
          .from('documents')
          .upload(pendingDoc.storagePath, encryptedBlob, { contentType: 'application/octet-stream', upsert: true });

        if (!uploadErr) {
          await supabase.from('documents').upsert({
            id: pendingDoc.id,
            user_id: userId,
            title: pendingDoc.title,
            category_id: pendingDoc.categoryId,
            tags: pendingDoc.tags,
            storage_path: pendingDoc.storagePath,
            mime_type: pendingDoc.mimeType,
            file_size: pendingDoc.fileSize,
            encryption_version: 1,
            created_at: pendingDoc.createdAt,
            updated_at: pendingDoc.updatedAt
          });
          await db.documents.update(pendingDoc.id, { syncStatus: 'synced' });
        }
      }
    }

    return { syncedCount };
  } catch (err: any) {
    return { syncedCount: 0, error: err.message };
  }
}
