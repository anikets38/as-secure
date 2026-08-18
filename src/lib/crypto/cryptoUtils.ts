/**
 * Helper cryptographic utility functions for ArrayBuffer <-> Base64 conversion
 * and random salt / IV generation using Web Crypto API across browser and workers.
 */

export function generateRandomSalt(byteLength: number = 16): string {
  const array = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(array);
  return bufferToBase64(array.buffer);
}

export function generateRandomIV(byteLength: number = 12): { raw: Uint8Array; base64: string } {
  const iv = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(iv);
  return {
    raw: iv,
    base64: bufferToBase64(iv.buffer)
  };
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = globalThis.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Computes SHA-256 hash of a file ArrayBuffer for local duplicate detection.
 */
export async function computeFileHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  return bufferToBase64(hashBuffer);
}
