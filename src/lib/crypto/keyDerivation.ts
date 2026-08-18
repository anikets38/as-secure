import { base64ToBuffer, generateRandomSalt } from './cryptoUtils';
import { DerivedKeyPackage } from './types';

const PBKDF2_ITERATIONS = 100000;

/**
 * Derives an AES-GCM 256-bit key from a user's vault password using PBKDF2 with SHA-256.
 * The vault password is NEVER stored in disk or cloud.
 */
export async function deriveVaultKey(
  password: string,
  existingSalt?: string
): Promise<DerivedKeyPackage> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Use existing salt if provided, or generate a fresh 16-byte random salt
  const saltBase64 = existingSalt || generateRandomSalt(16);
  const saltBuffer = base64ToBuffer(saltBase64);

  // Import raw password as key material
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM 256-bit encryption key
  const key = await globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // extractable = false
    ['encrypt', 'decrypt']
  );

  return {
    key,
    salt: saltBase64
  };
}

/**
 * Verifies if a given password can successfully decrypt a test verification payload.
 */
export async function verifyVaultPassword(
  password: string,
  salt: string,
  verificationEncryptedBuffer: ArrayBuffer,
  verificationIv: string
): Promise<CryptoKey | null> {
  try {
    const { key } = await deriveVaultKey(password, salt);
    const ivBuffer = base64ToBuffer(verificationIv);
    
    // Attempt test decryption
    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      verificationEncryptedBuffer
    );

    const decoder = new TextDecoder();
    const resultText = decoder.decode(decrypted);

    if (resultText && resultText.startsWith('AS_SECURE_VAULT_')) {
      return key;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Creates an encrypted payload used to verify the vault password on future unlocks.
 */
export async function createVaultVerificationPayload(key: CryptoKey): Promise<{
  encryptedBuffer: ArrayBuffer;
  iv: string;
}> {
  const encoder = new TextEncoder();
  const testBuffer = encoder.encode('AS_SECURE_VAULT_OK');
  
  const ivRaw = new Uint8Array(12);
  globalThis.crypto.getRandomValues(ivRaw);
  
  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivRaw },
    key,
    testBuffer
  );

  const { bufferToBase64 } = await import('./cryptoUtils');
  return {
    encryptedBuffer,
    iv: bufferToBase64(ivRaw.buffer)
  };
}
