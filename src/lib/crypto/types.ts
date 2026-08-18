export interface DerivedKeyPackage {
  key: CryptoKey;
  salt: string; // Base64 encoded salt
}

export interface EncryptedDataPayload {
  encryptedBuffer: ArrayBuffer;
  iv: string; // Base64 encoded IV
  algorithm: 'AES-GCM';
  version: number;
}

export interface EncryptionMetadata {
  iv: string;
  algorithm: string;
  version: number;
}
