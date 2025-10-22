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

async function findTonyProfile() {
  console.log('🔍 Searching for tony@fusionduotech.com...\n');

  // Check profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .or('email.eq.tony@fusionduotech.com,email.ilike.%tony%,email.ilike.%fusionduotech%');
  
  if (profileError) {
    console.log('❌ Error searching profiles:', profileError.message);
  } else {
    console.log(`Found ${profiles.length} matching profile(s):\n`);
    profiles.forEach(p => {
      console.log(`📧 ${p.email}`);
      console.log(`   Name: ${p.first_name} ${p.last_name}`);
      console.log(`   Profile ID: ${p.id}`);
      console.log(`   User ID: ${p.user_id || 'NULL'}`);
      console.log('');
    });
  }

  // Search for similar emails in case it's slightly different
  console.log('Checking all profiles with "tony" or "fusionduotech" in email...\n');
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, user_id')
    .or('email.ilike.%tony%,first_name.ilike.%tony%');
  
  if (allProfiles && allProfiles.length > 0) {
    console.log('Profiles with "tony" in email or name:');
    allProfiles.forEach(p => {
      console.log(`  - ${p.first_name} ${p.last_name} (${p.email})`);
      console.log(`    ID: ${p.id}, user_id: ${p.user_id || 'NULL'}`);
    });
  } else {
    console.log('No profiles found with "tony" in email or name');
  }

  // Check admin profile specifically
  console.log('\n\nChecking admin@furfield.com profile:');
  const { data: admin } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'admin@furfield.com')
    .single();
  
  if (admin) {
    console.log('Admin profile found:');
    console.log(`  Name: ${admin.first_name} ${admin.last_name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Profile ID: ${admin.id}`);
    console.log(`  User ID: ${admin.user_id || 'NULL'}`);
  }
}

findTonyProfile().catch(console.error);
