import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://usrsskztpuiyzgfollfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnNza3p0cHVpeXpnZm9sbGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDg0NDEsImV4cCI6MjEwMjYyNDQ0MX0.VXox9z7QRVJCEr0hl22yJzjRbi3wyW5NJGCIej6KtN0';

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_EMAIL = 'aniket.shinde21450@gmail.com';
const USER_PASS = 'aniket123***';
const VAULT_PASS = process.env.VAULT_PASS || 'vault123456';

function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

async function deriveVaultKey(password, saltBase64) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = Buffer.from(saltBase64, 'base64');

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

async function createVaultVerificationPayload(key) {
  const payloadString = 'AS_SECURE_VAULT_VERIFICATION_PAYLOAD_V1';
  const encoder = new TextEncoder();
  const payloadBuffer = encoder.encode(payloadString);

  const ivRaw = new Uint8Array(12);
  globalThis.crypto.getRandomValues(ivRaw);

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivRaw },
    key,
    payloadBuffer
  );

  return {
    encryptedBuffer: Buffer.from(encryptedBuffer),
    ivBase64: Buffer.from(ivRaw).toString('base64')
  };
}

async function main() {
  console.log(`🔐 Signing in as ${USER_EMAIL}...`);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: USER_EMAIL,
    password: USER_PASS
  });

  if (authErr || !authData?.user) {
    console.error('❌ Sign in failed:', authErr?.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Supabase User ID: ${userId}`);

  // Generate deterministic salt for user or random 16 bytes
  const saltBase64 = Buffer.from(crypto.randomBytes(16)).toString('base64');
  const key = await deriveVaultKey(VAULT_PASS, saltBase64);
  const { encryptedBuffer, ivBase64 } = await createVaultVerificationPayload(key);

  const verificationBlobBase64 = bufferToBase64(encryptedBuffer);
  const payloadString = `${saltBase64}::${verificationBlobBase64}::${ivBase64}`;

  console.log('⚡ Uploading Vault Salt & Verification Payload to Supabase Cloud...');
  const { error: upsertErr } = await supabase.from('documents').upsert({
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

  if (upsertErr) {
    console.error('❌ Upsert error:', upsertErr.message);
  } else {
    console.log('🎉 Vault Salt & Verification Payload successfully stored in Cloud!');
  }
}

main().catch(err => {
  console.error('Fatal seed error:', err);
});
