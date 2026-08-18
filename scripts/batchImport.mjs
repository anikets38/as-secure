import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const supabaseUrl = 'https://usrsskztpuiyzgfollfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnNza3p0cHVpeXpnZm9sbGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDg0NDEsImV4cCI6MjEwMjYyNDQ0MX0.VXox9z7QRVJCEr0hl22yJzjRbi3wyW5NJGCIej6KtN0';

const supabase = createClient(supabaseUrl, supabaseKey);

const SOURCE_DIR = 'D:\\Desktop\\Aniket Documents';
const USER_EMAIL = 'aniket.shinde21450@gmail.com';
const USER_PASS = 'aniket123***';

const VAULT_PASS = process.env.VAULT_PASS || 'vault123456';

function categorizeFilename(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('adhar') || lower.includes('aadhaar') || lower.includes('pan') || lower.includes('election') || lower.includes('domicile') || lower.includes('nationality') || lower.includes('ration') || lower.includes('cast')) {
    return 'cat_identity';
  }
  if (lower.includes('marksheet') || lower.includes('board') || lower.includes('cgpa') || lower.includes('sgpa') || lower.includes('school') || lower.includes('pccoe') || lower.includes('udemy') || lower.includes('certificate')) {
    return 'cat_education';
  }
  if (lower.includes('resume')) {
    return 'cat_employment';
  }
  if (lower.includes('bank') || lower.includes('passbook') || lower.includes('atm') || lower.includes('fees') || lower.includes('income') || lower.includes('mahadbt')) {
    return 'cat_finance';
  }
  return 'cat_other';
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

async function deriveKey(password, saltBase64) {
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

// Encrypts file and prepends 12-byte raw IV: [ 12-byte IV ][ AES-GCM Ciphertext ]
async function encryptAndPackBuffer(buffer, key) {
  const ivRaw = new Uint8Array(12);
  globalThis.crypto.getRandomValues(ivRaw);

  const encryptedCiphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivRaw },
    key,
    buffer
  );

  const combined = new Uint8Array(ivRaw.byteLength + encryptedCiphertext.byteLength);
  combined.set(ivRaw, 0);
  combined.set(new Uint8Array(encryptedCiphertext), ivRaw.byteLength);

  return Buffer.from(combined);
}

async function main() {
  console.log(`🔐 Signing in as ${USER_EMAIL}...`);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: USER_EMAIL,
    password: USER_PASS
  });

  if (authErr || !authData?.user) {
    console.error('❌ Failed to sign in to Supabase Auth:', authErr?.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Supabase User ID: ${userId}`);

  // Wipe previous rows for clean synchronization
  console.log(`🧹 Wiping previous document records...`);
  await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const saltBase64 = Buffer.from(crypto.randomBytes(16)).toString('base64');
  const key = await deriveKey(VAULT_PASS, saltBase64);

  const files = await fs.readdir(SOURCE_DIR);
  console.log(`📁 Found ${files.length} documents in ${SOURCE_DIR}`);

  let successCount = 0;
  let storageSuccess = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(SOURCE_DIR, filename);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) continue;

    const fileBuffer = await fs.readFile(filePath);
    const categoryId = categorizeFilename(filename);
    const mimeType = getMimeType(filename);
    const docId = crypto.randomUUID();

    const title = filename.replace(/\.[^/.]+$/, "");
    const storagePath = `${userId}/${docId}/encrypted.bin`;

    console.log(`[${i + 1}/${files.length}] Encrypting: ${filename} (${(stat.size / 1024).toFixed(1)} KB)...`);

    const packedBuffer = await encryptAndPackBuffer(fileBuffer, key);

    // 1. Upload packed binary payload to Supabase Storage
    const { error: storageErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, packedBuffer, {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (storageErr) {
      console.warn(`  ⚠️ Storage upload warning:`, storageErr.message);
    } else {
      console.log(`  ✅ Storage upload SUCCESS!`);
      storageSuccess++;
    }

    // 2. Insert metadata record into Supabase Postgres
    const now = new Date().toISOString();
    const { error: dbErr } = await supabase.from('documents').insert({
      id: docId,
      user_id: userId,
      title: title,
      category_id: categoryId,
      tags: ['imported', 'original'],
      storage_path: storagePath,
      mime_type: mimeType,
      file_size: stat.size,
      encryption_version: 1,
      created_at: now,
      updated_at: now
    });

    if (dbErr) {
      console.error(`  ❌ Postgres metadata error for ${filename}:`, dbErr.message);
    } else {
      successCount++;
    }
  }

  console.log(`\n🎉 Upload Summary: ${successCount}/${files.length} metadata rows in Postgres, ${storageSuccess}/${files.length} binary files in Storage Bucket.`);
}

main().catch(err => {
  console.error('Fatal batch import error:', err);
});
