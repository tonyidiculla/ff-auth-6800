const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_SUPABASE_SECRET_ROLE_KEY;

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
});

async function checkDatabase() {
  console.log('🔍 Checking Supabase Configuration...\n');

  // Check if storage bucket exists
  console.log('1. Checking storage bucket "profile-icon"...');
  const { data: buckets, error: bucketError } = await supabase
    .from('buckets')
    .select('*')
    .eq('id', 'profile-icon')
    .maybeSingle();

  if (bucketError) {
    console.log('   ❌ Error checking bucket:', bucketError.message);
  } else if (buckets) {
    console.log('   ✅ Bucket exists:', JSON.stringify(buckets, null, 2));
  } else {
    console.log('   ❌ Bucket "profile-icon" does NOT exist');
    console.log('   📝 Create it with SQL:');
    console.log('      INSERT INTO storage.buckets (id, name, public)');
    console.log('      VALUES (\'profile-icon\', \'profile-icon\', true);');
  }

  // Check if icon_storage column exists in profiles table
  console.log('\n2. Checking "icon_storage" column in profiles table...');
  const { data: columns, error: columnError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', 'profiles')
    .eq('column_name', 'icon_storage');

  if (columnError) {
    console.log('   ❌ Error checking column:', columnError.message);
  } else if (columns && columns.length > 0) {
    console.log('   ✅ Column exists:', JSON.stringify(columns[0], null, 2));
  } else {
    console.log('   ❌ Column "icon_storage" does NOT exist in profiles table');
    console.log('   📝 Create it with SQL:');
    console.log('      ALTER TABLE profiles ADD COLUMN icon_storage TEXT;');
  }

  // Check all columns in profiles table
  console.log('\n3. All columns in profiles table:');
  const { data: allColumns, error: allColumnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_schema', 'public')
    .eq('table_name', 'profiles')
    .order('ordinal_position');

  if (allColumnsError) {
    console.log('   ❌ Error:', allColumnsError.message);
  } else if (allColumns) {
    allColumns.forEach(col => {
      const indicator = col.column_name === 'icon_storage' ? '✅' : '  ';
      console.log(`   ${indicator} ${col.column_name} (${col.data_type})`);
    });
  }

  // Try to list buckets using storage API
  console.log('\n4. Listing all storage buckets via API...');
  const { data: allBuckets, error: listError } = await supabase
    .storage
    .listBuckets();

  if (listError) {
    console.log('   ❌ Error:', listError.message);
  } else if (allBuckets) {
    console.log('   Found', allBuckets.length, 'bucket(s):');
    allBuckets.forEach(bucket => {
      const indicator = bucket.id === 'profile-icon' ? '✅' : '  ';
      console.log(`   ${indicator} ${bucket.id} (public: ${bucket.public})`);
    });
  }

  console.log('\n✅ Check complete!\n');
}

checkDatabase().catch(console.error);
