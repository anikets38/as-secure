import { base64ToBuffer } from './cryptoUtils';

/**
 * Decrypts an encrypted document ArrayBuffer in browser memory using AES-GCM key and IV.
 */
export async function decryptFileBuffer(
  encryptedBuffer: ArrayBuffer,
  ivBase64: string,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const ivBuffer = base64ToBuffer(ivBase64);

  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    key,
    encryptedBuffer
  );

  return decryptedBuffer;
}

/**
 * Helper to decrypt encrypted text string.
 */
export async function decryptText(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const encryptedBuffer = base64ToBuffer(ciphertextBase64);
  const decryptedBuffer = await decryptFileBuffer(encryptedBuffer, ivBase64, key);
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
