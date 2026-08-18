import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://usrsskztpuiyzgfollfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnNza3p0cHVpeXpnZm9sbGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDg0NDEsImV4cCI6MjEwMjYyNDQ0MX0.VXox9z7QRVJCEr0hl22yJzjRbi3wyW5NJGCIej6KtN0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔐 Signing in to deduplicate Supabase Postgres database...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'aniket.shinde21450@gmail.com',
    password: 'aniket123***'
  });

  if (authErr || !authData?.user) {
    console.error('❌ Login failed:', authErr);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Logged in as ${authData.user.email} (${userId})`);

  // Fetch all documents for this user
  const { data: allDocs, error: fetchErr } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId);

  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    process.exit(1);
  }

  console.log(`📊 Found ${allDocs.length} total rows in Postgres documents table.`);

  // Group by title
  const titleGroups = new Map();
  for (const doc of allDocs) {
    const key = doc.title.trim().toLowerCase();
    if (!titleGroups.has(key)) {
      titleGroups.set(key, []);
    }
    titleGroups.get(key).push(doc);
  }

  console.log(`🎯 Identified ${titleGroups.size} unique document titles.`);

  let deletedCount = 0;
  let keptCount = 0;

  for (const [titleKey, docs] of titleGroups.entries()) {
    // Sort by created_at descending (keep latest)
    docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const keepDoc = docs[0];
    keptCount++;

    const duplicatesToDelete = docs.slice(1);
    for (const dup of duplicatesToDelete) {
      const { error: delErr } = await supabase
        .from('documents')
        .delete()
        .eq('id', dup.id);

      if (delErr) {
        console.warn(`  ⚠️ Failed to delete duplicate ID ${dup.id}:`, delErr.message);
      } else {
        deletedCount++;
      }
    }
  }

  console.log(`\n🎉 Deduplication Complete! Kept ${keptCount} unique documents, deleted ${deletedCount} duplicate rows.`);

  // Final count check
  const { data: finalDocs } = await supabase.from('documents').select('id').eq('user_id', userId);
  console.log(`✨ Remaining rows in Postgres documents table: ${finalDocs?.length}`);
}

main().catch(err => {
  console.error('Fatal deduplication error:', err);
});
