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
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

async function diagnoseAuthUsers() {
  console.log('🔍 Diagnosing auth.users and profiles relationship...\n');

  // Check auth.users
  console.log('1️⃣ Checking auth.users table...');
  try {
    // Try to query auth.users through RPC or direct query
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(5);
    
    if (authError) {
      console.log('❌ Cannot query auth.users directly:', authError.message);
      console.log('   This is expected - auth schema is restricted\n');
    } else {
      console.log('✅ auth.users accessible:', authUsers?.length || 0, 'records');
    }
  } catch (err) {
    console.log('❌ Error accessing auth.users:', err.message);
  }

  // Check profiles
  console.log('\n2️⃣ Checking profiles table...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, user_id, first_name, last_name')
    .limit(5);

  if (profileError) {
    console.log('❌ Error:', profileError.message);
  } else {
    console.log('✅ Found', profiles.length, 'profiles:');
    profiles.forEach(p => {
      console.log(`   - ${p.first_name} ${p.last_name} (${p.email})`);
      console.log(`     user_id: ${p.user_id || 'NULL'}`);
      console.log(`     profile id: ${p.id}`);
    });
  }

  // Check if profiles.id might BE the user_id
  console.log('\n3️⃣ Checking if profiles.id matches auth user pattern...');
  const { data: sampleProfiles, error } = await supabase
    .from('profiles')
    .select('id, email, user_id')
    .limit(3);
  
  if (sampleProfiles) {
    console.log('Sample profile IDs:');
    sampleProfiles.forEach(p => {
      console.log(`   ${p.email}: profile.id = ${p.id}, user_id = ${p.user_id}`);
    });
  }

  // Try to find the actual foreign key relationship
  console.log('\n4️⃣ Checking foreign key constraints...');
  const { data: fkData, error: fkError } = await supabase.rpc('get_foreign_keys', {}).catch(() => null);
  
  if (!fkError && fkData) {
    console.log('Foreign keys:', fkData);
  } else {
    console.log('Cannot query foreign keys directly from RLS-protected views');
  }

  // Check what columns profiles has
  console.log('\n5️⃣ Checking profiles table structure...');
  const { data: tableInfo, error: tableError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (tableInfo && tableInfo[0]) {
    console.log('Profiles table columns:');
    Object.keys(tableInfo[0]).forEach(col => {
      const value = tableInfo[0][col];
      const type = typeof value;
      console.log(`   - ${col}: ${type} = ${JSON.stringify(value)?.substring(0, 50)}`);
    });
  }

  // Check icon_storage specifically
  console.log('\n6️⃣ Checking icon_storage values...');
  const { data: iconData } = await supabase
    .from('profiles')
    .select('email, icon_storage')
    .not('icon_storage', 'is', null)
    .limit(5);
  
  if (iconData && iconData.length > 0) {
    console.log('Profiles with icon_storage set:');
    iconData.forEach(p => {
      console.log(`   ${p.email}: ${typeof p.icon_storage} = ${JSON.stringify(p.icon_storage)?.substring(0, 100)}`);
    });
  } else {
    console.log('No profiles have icon_storage set');
  }

  console.log('\n✅ Diagnosis complete!');
}

diagnoseAuthUsers().catch(console.error);
