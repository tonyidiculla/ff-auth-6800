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

async function checkAvatarFile() {
  console.log('🔍 Checking avatar file in storage...\n');

  // Check Tony's profile
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
  console.log(`   Avatar Storage Path: ${profile.avatar_storage || 'NULL'}`);

  if (profile.avatar_storage) {
    // Try to get file info
    const pathParts = profile.avatar_storage.split('/');
    const folder = pathParts.slice(0, -1).join('/');
    const fileName = pathParts[pathParts.length - 1];
    
    console.log(`\n📁 Checking folder: ${folder}`);
    console.log(`📄 Looking for file: ${fileName}`);
    
    const { data: files, error: listError } = await supabase.storage
      .from('profile-icons')
      .list(folder);
    
    if (listError) {
      console.log('❌ Error listing files:', listError.message);
    } else {
      console.log(`\n✅ Found ${files.length} file(s) in ${folder}:`);
      files.forEach(file => {
        const match = file.name === fileName ? '✅' : '  ';
        console.log(`   ${match} ${file.name} (${file.metadata?.size || 0} bytes)`);
      });
      
      const fileExists = files.some(f => f.name === fileName);
      if (fileExists) {
        console.log('\n✅✅✅ Avatar file EXISTS in storage!');
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-icons')
          .getPublicUrl(profile.avatar_storage);
        
        console.log('\n🌐 Public URL:', urlData.publicUrl);
        console.log('\n💡 Try opening this URL in your browser to see if it loads');
      } else {
        console.log('\n❌ Avatar file NOT FOUND in storage!');
        console.log('💡 You need to re-upload your avatar');
      }
    }
  } else {
    console.log('\n⚠️  No avatar_storage path set');
  }
}

checkAvatarFile().catch(console.error);
