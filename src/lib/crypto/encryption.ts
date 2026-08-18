import { generateRandomIV, bufferToBase64 } from './cryptoUtils';
import { EncryptedDataPayload } from './types';

/**
 * Encrypts a document ArrayBuffer using AES-GCM 256-bit with a freshly generated random IV.
 * NEVER reuses an IV with the same key.
 */
export async function encryptFileBuffer(
  plaintextBuffer: ArrayBuffer,
  key: CryptoKey
): Promise<EncryptedDataPayload> {
  const { raw: ivRaw, base64: ivBase64 } = generateRandomIV(12);

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivRaw
    },
    key,
    plaintextBuffer
  );

  return {
    encryptedBuffer,
    iv: ivBase64,
    algorithm: 'AES-GCM',
    version: 1
  };
}

/**
 * Helper to encrypt a string (e.g. sensitive title/notes metadata).
 */
export async function encryptText(
  text: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const { encryptedBuffer, iv } = await encryptFileBuffer(data.buffer, key);
  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv
  };
}
