import Dexie, { Table } from 'dexie';
import {
  DocumentRecord,
  CachedFileBlob,
  Category,
  VaultSettings,
  VaultMetadata,
  SyncQueueItem
} from '@/types';

export class ASSecureDatabase extends Dexie {
  documents!: Table<DocumentRecord, string>;
  cachedFiles!: Table<CachedFileBlob, string>;
  categories!: Table<Category, string>;
  settings!: Table<VaultSettings, string>;
  vaultMetadata!: Table<VaultMetadata, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('ASSecureVaultDB');

    this.version(1).stores({
      documents: 'id, title, categoryId, syncStatus, localAvailable, createdAt, updatedAt',
      cachedFiles: 'id, updatedAt',
      categories: 'id, name',
      settings: 'id',
      vaultMetadata: 'id',
      syncQueue: 'id, documentId, action, status, createdAt'
    });

    // Version 2: Index userId for multi-user querying & strict device isolation
    this.version(2).stores({
      documents: 'id, userId, title, categoryId, syncStatus, localAvailable, createdAt, updatedAt'
    });
  }
}

export const db = new ASSecureDatabase();

// Default Pre-populated Categories as per Section 15 of spec
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_identity', name: 'Identity (Aadhaar/PAN/Passport)', iconName: 'ShieldCheck', color: '#D65DB1' },
  { id: 'cat_education', name: 'Education & Marksheets', iconName: 'GraduationCap', color: '#FF6F91' },
  { id: 'cat_finance', name: 'Finance & Bank Statements', iconName: 'Landmark', color: '#FF9671' },
  { id: 'cat_employment', name: 'Employment & Resume', iconName: 'Briefcase', color: '#3B82F6' },
  { id: 'cat_travel', name: 'Travel & Visas', iconName: 'Plane', color: '#06B6D4' },
  { id: 'cat_insurance', name: 'Insurance Policies', iconName: 'FileCheck', color: '#10B981' },
  { id: 'cat_property', name: 'Property & House Docs', iconName: 'Home', color: '#8B5CF6' },
  { id: 'cat_medical', name: 'Medical & Health Reports', iconName: 'Activity', color: '#EC4899' },
  { id: 'cat_certificates', name: 'Certificates & Licences', iconName: 'Award', color: '#F59E0B' },
  { id: 'cat_other', name: 'Other Important Docs', iconName: 'Folder', color: '#64748B' }
];

export async function initializeDefaultCategories(): Promise<void> {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }
}
