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

async function checkTonyAvatar() {
  console.log('🔍 Checking Tony\'s avatar setup...\n');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'tony@fusionduotech.com')
    .single();
  
  if (!profile) {
    console.log('❌ Profile not found!');
    return;
  }

  console.log('✅ Profile found:');
  console.log(`   Name: ${profile.first_name} ${profile.last_name}`);
  console.log(`   Email: ${profile.email}`);
  console.log(`   Profile ID: ${profile.id}`);
  console.log(`   User ID: ${profile.user_id || 'NULL'}`);
  console.log(`   Icon Storage: ${profile.icon_storage || 'NULL'}`);
  console.log(`   Icon Storage Type: ${typeof profile.icon_storage}`);

  if (profile.icon_storage && typeof profile.icon_storage === 'string') {
    console.log('\n🖼️  Generating avatar URL...');
    const { data: urlData } = supabase.storage
      .from('profile-icons')
      .getPublicUrl(profile.icon_storage);
    
    console.log('   Avatar URL:', urlData.publicUrl);
    
    // Check if file exists in storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('profile-icons')
      .list('avatars', {
        search: profile.id.substring(0, 8)
      });
    
    if (fileError) {
      console.log('   ⚠️  Error checking storage:', fileError.message);
    } else {
      console.log(`   ✅ Found ${fileData.length} file(s) in storage`);
      fileData.forEach(file => {
        console.log(`      - ${file.name} (${file.metadata?.size} bytes)`);
      });
    }
  } else {
    console.log('\n⚠️  No icon_storage set or wrong type');
  }

  // Check role assignment
  console.log('\n👤 Checking role assignment...');
  const { data: roleData } = await supabase
    .from('user_to_role_assignment')
    .select('*, platform_roles(*)')
    .eq('user_id', profile.user_id);
  
  if (roleData && roleData.length > 0) {
    roleData.forEach(r => {
      console.log(`   ✅ Role: ${r.platform_roles.display_name || r.platform_roles.role_name}`);
    });
  } else {
    console.log('   ⚠️  No role assigned');
  }
}

checkTonyAvatar().catch(console.error);
