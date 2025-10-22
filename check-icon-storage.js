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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_SUPABASE_SECRET_ROLE_KEY, {
  db: { schema: 'public' }
});

async function check() {
  console.log('Checking profiles table structure and data...\n');
  
  // Get your user's profile
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, icon_storage')
    .limit(5);
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Found', profiles.length, 'profiles:');
    profiles.forEach(p => {
      console.log(`  - ${p.first_name} ${p.last_name}`);
      console.log(`    user_id: ${p.user_id}`);
      console.log(`    icon_storage: ${p.icon_storage || '(not set)'}\n`);
    });
  }
}

check().catch(console.error);
