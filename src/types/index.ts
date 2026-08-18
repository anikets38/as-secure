export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

export interface DocumentRecord {
  id: string;
  userId?: string;
  title: string;
  categoryId: string;
  tags: string[];
  storagePath: string;
  mimeType: string;
  fileSize: number;
  encryptionVersion: number;
  createdAt: string;
  updatedAt: string;
  localAvailable: boolean;
  syncStatus: SyncStatus;
  isEncrypted: boolean;
  expiryDate?: string;
  reminderDate?: string;
  contentHash?: string;
  notes?: string;
}

export interface CachedFileBlob {
  id: string; // documentId
  encryptedBlob: ArrayBuffer;
  iv: string; // Base64 or Hex IV string
  mimeType: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  color?: string;
  isCustom?: boolean;
}

export interface VaultSettings {
  id: string; // 'vault_settings'
  autoLockMinutes: number; // 0 (never), 5, 15, 30, 60
  themePreference: 'light' | 'dark' | 'system';
  isLocalOnlyMode: boolean;
  lastBackupAt?: string;
}

export interface VaultMetadata {
  id: string; // 'vault_metadata'
  salt: string; // Base64 salt used for PBKDF2
  keyVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: string;
  documentId: string;
  action: 'upload' | 'download' | 'delete';
  status: 'pending' | 'processing' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: string;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
  } | null;
  isAuthenticated: boolean;
  isVaultUnlocked: boolean;
}
