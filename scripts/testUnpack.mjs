import { base64ToBuffer, bufferToBase64 } from '../src/lib/crypto/cryptoUtils.ts';

function packIvAndCiphertext(ivBase64, ciphertextBuffer) {
  const ivBuffer = base64ToBuffer(ivBase64);
  const combined = new Uint8Array(ivBuffer.byteLength + ciphertextBuffer.byteLength);
  combined.set(new Uint8Array(ivBuffer), 0);
  combined.set(new Uint8Array(ciphertextBuffer), ivBuffer.byteLength);
  return combined.buffer;
}

function unpackIvAndCiphertext(packedBuffer) {
  const packedArray = new Uint8Array(packedBuffer);
  const ivArray = packedArray.slice(0, 12);
  const ciphertextArray = packedArray.slice(12);

  const ivBuffer = ivArray.buffer.slice(ivArray.byteOffset, ivArray.byteOffset + ivArray.byteLength);
  const ciphertextBuffer = ciphertextArray.buffer.slice(ciphertextArray.byteOffset, ciphertextArray.byteOffset + ciphertextArray.byteLength);

  return {
    ivBase64: bufferToBase64(ivBuffer),
    ciphertextBuffer
  };
}

async function main() {
  const originalIv = '1234567890123456'; // 12 bytes base64
  const originalCiphertext = new TextEncoder().encode('HELLO_ENCRYPTED_DATA_TEST_12345').buffer;

  const packed = packIvAndCiphertext(originalIv, originalCiphertext);
  console.log('Packed total byteLength:', packed.byteLength);

  const { ivBase64, ciphertextBuffer } = unpackIvAndCiphertext(packed);

  console.log('Unpacked IV byteLength:', base64ToBuffer(ivBase64).byteLength);
  console.log('Unpacked Ciphertext byteLength:', ciphertextBuffer.byteLength);

  const decodedText = new TextDecoder().decode(ciphertextBuffer);
  console.log('Decoded text matches original:', decodedText === 'HELLO_ENCRYPTED_DATA_TEST_12345');
}

main();
