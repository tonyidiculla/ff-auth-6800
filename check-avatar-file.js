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
  console.log('🔍 Checking avatar files in storage...\n');

  // List all files in the avatars folder
  const { data: files, error } = await supabase.storage
    .from('profile-icons')
    .list('avatars', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) {
    console.log('❌ Error listing files:', error.message);
    return;
  }

  console.log(`Found ${files.length} files in profile-icons/avatars:\n`);
  
  // Show files for Tony's user_id
  const tonyUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4';
  const tonyFiles = files.filter(f => f.name.includes(tonyUserId));
  
  console.log(`Tony's avatar files (user_id: ${tonyUserId}):`);
  tonyFiles.forEach(file => {
    console.log(`  📁 ${file.name}`);
    console.log(`     Size: ${file.metadata?.size} bytes`);
    console.log(`     Created: ${file.created_at}`);
    console.log(`     Updated: ${file.updated_at}`);
    
    // Generate public URL
    const { data: urlData } = supabase.storage
      .from('profile-icons')
      .getPublicUrl(`avatars/${file.name}`);
    console.log(`     URL: ${urlData.publicUrl}\n`);
  });

  if (tonyFiles.length === 0) {
    console.log('  ❌ No files found for Tony!');
    console.log('\nShowing all files:');
    files.slice(0, 5).forEach(f => console.log(`  - ${f.name}`));
  }
}

checkAvatarFile().catch(console.error);
