import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://usrsskztpuiyzgfollfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnNza3p0cHVpeXpnZm9sbGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDg0NDEsImV4cCI6MjEwMjYyNDQ0MX0.VXox9z7QRVJCEr0hl22yJzjRbi3wyW5NJGCIej6KtN0';

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_EMAIL = 'aniket.shinde21450@gmail.com';
const USER_PASS = 'aniket123***';
const VAULT_PASS = 'vault123456';

function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function base64ToBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

async function deriveVaultKey(password, saltBase64) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = base64ToBuffer(saltBase64);

  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

function packIvAndCiphertext(ivRaw, ciphertextBuffer) {
  const combined = new Uint8Array(ivRaw.byteLength + ciphertextBuffer.byteLength);
  combined.set(ivRaw, 0);
  combined.set(new Uint8Array(ciphertextBuffer), ivRaw.byteLength);
  return combined.buffer;
}

function unpackIvAndCiphertext(packedBuffer) {
  const packedArray = new Uint8Array(packedBuffer);
  const ivArray = packedArray.slice(0, 12);
  const ciphertextArray = packedArray.slice(12);

  const ivBuffer = ivArray.buffer.slice(ivArray.byteOffset, ivArray.byteOffset + ivArray.byteLength);
  const ciphertextBuffer = ciphertextArray.buffer.slice(ciphertextArray.byteOffset, ciphertextArray.byteOffset + ciphertextArray.byteLength);

  return {
    ivBuffer,
    ciphertextBuffer
  };
}

async function main() {
  console.log('🧪 Starting End-to-End Multi-Device Cryptographic Verification Test...\n');

  // Step 1: Sign in as user
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: USER_EMAIL,
    password: USER_PASS
  });
  const userId = authData.user.id;
  console.log(`1. Authenticated User ID: ${userId}`);

  // Step 2: Device A (Mobile) setup
  console.log('\n2. Device A (Mobile): Creating Vault & Deriving Key_A...');
  const saltBase64 = Buffer.from(crypto.randomBytes(16)).toString('base64');
  const keyA = await deriveVaultKey(VAULT_PASS, saltBase64);

  // Upload Vault Salt & Payload to Supabase
  const testVerificationText = 'AS_SECURE_VAULT_OK';
  const ivVerification = new Uint8Array(12);
  globalThis.crypto.getRandomValues(ivVerification);
  const verificationEncrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivVerification },
    keyA,
    new TextEncoder().encode(testVerificationText)
  );

  const payloadString = `${saltBase64}::${bufferToBase64(verificationEncrypted)}::${bufferToBase64(ivVerification)}`;

  await supabase.from('documents').upsert({
    id: '00000000-0000-0000-0000-000000000000',
    user_id: userId,
    title: '__VAULT_SALT_PAYLOAD__',
    category_id: 'cat_system',
    storage_path: payloadString,
    mime_type: 'application/x-vault-settings',
    file_size: payloadString.length,
    encryption_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  console.log('   ✅ Device A uploaded unified vault salt & verification payload to cloud.');

  // Device A encrypts a test document
  const sampleDocumentText = 'SECRET_PERSONAL_DOCUMENT_CONTENT_PASSPORT_12345';
  const sampleBuffer = new TextEncoder().encode(sampleDocumentText).buffer;

  const ivDoc = new Uint8Array(12);
  globalThis.crypto.getRandomValues(ivDoc);
  const ciphertextDoc = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivDoc },
    keyA,
    sampleBuffer
  );

  const packedPayload = packIvAndCiphertext(ivDoc, ciphertextDoc);
  const docId = crypto.randomUUID();
  const storagePath = `${userId}/${docId}/encrypted.bin`;

  console.log('   🔒 Device A encrypted document with Key_A and uploading to Supabase Storage...');
  await supabase.storage
    .from('documents')
    .upload(storagePath, packedPayload, { contentType: 'application/octet-stream', upsert: true });

  await supabase.from('documents').insert({
    id: docId,
    user_id: userId,
    title: 'Multi Device Test Document',
    category_id: 'cat_identity',
    storage_path: storagePath,
    mime_type: 'text/plain',
    file_size: sampleBuffer.byteLength,
    encryption_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  console.log('   ✅ Device A upload complete!');

  // Step 3: Device B (PC) opens website & unlocks
  console.log('\n3. Device B (PC): Connecting to Cloud & Fetching Vault Salt...');
  const { data: cloudVault } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .eq('title', '__VAULT_SALT_PAYLOAD__')
    .single();

  const [fetchedSalt, fetchedBlobBase64, fetchedIvBase64] = cloudVault.storage_path.split('::');
  console.log('   ✅ Device B downloaded salt from Cloud.');

  console.log('   🔑 Device B: User enters Vault Password "vault123456" -> Deriving Key_B...');
  const keyB = await deriveVaultKey(VAULT_PASS, fetchedSalt);

  // Verify Key_B against verification payload
  const decryptedVerification = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(fetchedIvBase64) },
    keyB,
    base64ToBuffer(fetchedBlobBase64)
  );
  const verifiedText = new TextDecoder().decode(decryptedVerification);
  console.log(`   Verification payload test: "${verifiedText}" (Matches: ${verifiedText === 'AS_SECURE_VAULT_OK'})`);

  // Step 4: Device B downloads & decrypts the file uploaded by Device A
  console.log('\n4. Device B (PC): Downloading & Decrypting Document uploaded by Device A...');
  const { data: downloadedBlob } = await supabase.storage
    .from('documents')
    .download(storagePath);

  const downloadedPackedBuffer = await downloadedBlob.arrayBuffer();
  const { ivBuffer, ciphertextBuffer } = unpackIvAndCiphertext(downloadedPackedBuffer);

  const decryptedDocBuffer = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    keyB,
    ciphertextBuffer
  );

  const decryptedDocText = new TextDecoder().decode(decryptedDocBuffer);
  console.log(`\n🎉 RESULT: Decrypted text on Device B: "${decryptedDocText}"`);
  console.log(`✨ Decryption Match 100% Verified: ${decryptedDocText === sampleDocumentText}`);

  // Cleanup test row
  await supabase.from('documents').delete().eq('id', docId);
  await supabase.storage.from('documents').remove([storagePath]);
}

main().catch(err => {
  console.error('Test error:', err);
});
