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

async function fixUserIds() {
  console.log('🔧 FIXING user_id values in profiles...\n');

  // Theory: profiles.id IS the auth user id
  // So we should set user_id = id
  
  console.log('Step 1: Check current state');
  const { data: before } = await supabase
    .from('profiles')
    .select('id, email, user_id, first_name, last_name')
    .limit(3);
  
  console.log('BEFORE UPDATE:');
  before?.forEach(p => {
    console.log(`  ${p.first_name}: id=${p.id}, user_id=${p.user_id}`);
  });

  console.log('\nStep 2: Updating profiles individually...');
  
  // Get all profiles with null user_id
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .is('user_id', null)
    .limit(500); // Do in batches
  
  if (!allProfiles || allProfiles.length === 0) {
    console.log('✅ No profiles need updating!');
    return;
  }

  console.log(`Found ${allProfiles.length} profiles to update\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const profile of allProfiles) {
    const { error: singleError } = await supabase
      .from('profiles')
      .update({ user_id: profile.id })
      .eq('id', profile.id);
    
    if (singleError) {
      console.log(`  ❌ Failed to update ${profile.first_name}: ${singleError.message}`);
      errorCount++;
    } else {
      successCount++;
      if (successCount <= 5 || successCount % 50 === 0) {
        console.log(`  ✅ Updated ${profile.first_name} (${successCount}/${allProfiles.length})`);
      }
    }
  }
  
  console.log(`\n📊 Results: ${successCount} successful, ${errorCount} failed`);

  console.log('\nStep 3: Verify the fix');
  const { data: after } = await supabase
    .from('profiles')
    .select('id, email, user_id, first_name, last_name')
    .limit(3);
  
  console.log('\nAFTER UPDATE:');
  after?.forEach(p => {
    const match = p.id === p.user_id ? '✅' : '❌';
    console.log(`  ${match} ${p.first_name}: id=${p.id.substring(0, 8)}..., user_id=${p.user_id ? p.user_id.substring(0, 8) + '...' : 'NULL'}`);
  });

  // Check how many still have null
  const { count: nullCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);
  
  const { count: totalCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 Total profiles: ${totalCount}`);
  console.log(`📊 Profiles with user_id set: ${totalCount - nullCount}`);
  console.log(`📊 Profiles with null user_id: ${nullCount}`);
  
  if (nullCount === 0) {
    console.log('\n✅✅✅ ALL PROFILES FIXED! ✅✅✅');
    console.log('Now try uploading your avatar again!');
  }
}

fixUserIds().catch(console.error);
