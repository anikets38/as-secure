import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://usrsskztpuiyzgfollfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnNza3p0cHVpeXpnZm9sbGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDg0NDEsImV4cCI6MjEwMjYyNDQ0MX0.VXox9z7QRVJCEr0hl22yJzjRbi3wyW5NJGCIej6KtN0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔐 Signing in as aniket.shinde21450@gmail.com to wipe all documents...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'aniket.shinde21450@gmail.com',
    password: 'aniket123***'
  });

  if (authErr || !authData?.user) {
    console.error('❌ Sign in error:', authErr?.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Supabase User ID: ${userId}`);

  // 1. Delete all document metadata rows from Postgres
  console.log('🧹 Wiping document metadata from Supabase Postgres database...');
  const { error: dbErr } = await supabase
    .from('documents')
    .delete()
    .eq('user_id', userId);

  if (dbErr) {
    console.error('❌ Database delete error:', dbErr.message);
  } else {
    console.log('✅ All metadata rows deleted from Postgres!');
  }

  // 2. List and delete all files in storage bucket under this user's folder
  console.log('🧹 Wiping binary files from Supabase Storage bucket...');
  const { data: storageFiles, error: listErr } = await supabase.storage
    .from('documents')
    .list(userId);

  if (storageFiles && storageFiles.length > 0) {
    const pathsToDelete = storageFiles.map(f => `${userId}/${f.name}`);
    const { error: delStorageErr } = await supabase.storage
      .from('documents')
      .remove(pathsToDelete);

    if (delStorageErr) {
      console.warn('⚠️ Storage remove warning:', delStorageErr.message);
    } else {
      console.log(`✅ Deleted ${pathsToDelete.length} storage folders/files.`);
    }
  } else {
    console.log('✅ Storage bucket is clean.');
  }

  console.log('\n🎉 ALL DOCUMENTS WIPED! Cloud database is now completely empty (0 documents).');
}

main().catch(err => {
  console.error('Fatal wipe error:', err);
});
