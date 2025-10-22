-- ============================================
-- RENAME icon_storage TO avatar_storage
-- AND UPDATE STORAGE PATH
-- ============================================

-- Step 1: Check current column
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name IN ('icon_storage', 'avatar_storage');

-- Step 2: Rename the column
ALTER TABLE public.profiles 
RENAME COLUMN icon_storage TO avatar_storage;

-- Step 3: Update existing paths from 'avatars/' to 'avatars/users/'
UPDATE public.profiles
SET avatar_storage = REPLACE(avatar_storage, 'avatars/', 'avatars/users/')
WHERE avatar_storage LIKE 'avatars/%' 
  AND avatar_storage NOT LIKE 'avatars/users/%';

-- Step 4: Verify the changes
SELECT 
    COUNT(*) as total_profiles,
    COUNT(avatar_storage) as profiles_with_avatar,
    COUNT(CASE WHEN avatar_storage LIKE 'avatars/users/%' THEN 1 END) as using_new_path
FROM public.profiles;

-- Step 5: Sample of updated records
SELECT id, email, first_name, last_name, avatar_storage
FROM public.profiles
WHERE avatar_storage IS NOT NULL
LIMIT 10;
