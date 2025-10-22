const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_SUPABASE_SECRET_ROLE_KEY,
  {
    db: { schema: 'public' }
  }
);

async function handleRemainingProfiles() {
  console.log('🔍 Checking remaining profiles with null user_id...\n');

  const { data: remaining } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .is('user_id', null);
  
  console.log(`Found ${remaining?.length || 0} profiles still with null user_id:\n`);
  
  remaining?.forEach((p, i) => {
    console.log(`${i + 1}. ${p.first_name} ${p.last_name} (${p.email})`);
    console.log(`   Profile ID: ${p.id}`);
  });

  console.log('\n💡 These profiles have IDs that don\'t exist in auth.users.');
  console.log('💡 This means they were created directly in profiles without auth accounts.');
  console.log('\nOptions:');
  console.log('1. Delete these orphaned profiles');
  console.log('2. Create auth.users accounts for them');
  console.log('3. Leave them as-is (they won\'t be able to login)');
}

handleRemainingProfiles().catch(console.error);
