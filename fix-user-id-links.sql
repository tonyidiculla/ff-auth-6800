-- ============================================
-- FIX PROFILES.USER_ID NULL VALUES
-- ============================================
-- This script links profiles to auth.users by matching email addresses
-- Run this in Supabase SQL Editor

-- Step 1: Verify the problem
SELECT 
    COUNT(*) as total_profiles,
    COUNT(user_id) as profiles_with_user_id,
    COUNT(*) - COUNT(user_id) as profiles_missing_user_id
FROM profiles;

-- Step 2: Preview what will be updated (dry run)
SELECT 
    p.id as profile_id,
    p.email as profile_email,
    p.first_name,
    p.last_name,
    p.user_id as current_user_id,
    au.id as auth_user_id,
    CASE WHEN au.id IS NULL THEN '❌ NO MATCH' ELSE '✅ WILL UPDATE' END as status
FROM profiles p
LEFT JOIN auth.users au ON p.email = au.email
WHERE p.user_id IS NULL
ORDER BY status DESC, p.email
LIMIT 50;

-- Step 3: Count how many will be updated
SELECT 
    COUNT(*) as profiles_to_update
FROM profiles p
INNER JOIN auth.users au ON p.email = au.email
WHERE p.user_id IS NULL;

-- Step 4: ACTUAL UPDATE - Link profiles to auth.users by email
-- ⚠️ REVIEW THE DRY RUN RESULTS ABOVE BEFORE RUNNING THIS!
UPDATE profiles p
SET user_id = au.id
FROM auth.users au
WHERE p.email = au.email 
  AND p.user_id IS NULL;

-- Step 5: Verify the fix worked
SELECT 
    COUNT(*) as total_profiles,
    COUNT(user_id) as profiles_with_user_id,
    COUNT(*) - COUNT(user_id) as profiles_still_missing_user_id
FROM profiles;

-- Step 6: Check for profiles that couldn't be linked (no matching auth.users)
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    '❌ No matching auth.users record' as issue
FROM profiles p
LEFT JOIN auth.users au ON p.email = au.email
WHERE p.user_id IS NULL
  AND au.id IS NULL;

-- Step 7: Check icon_storage column data type
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'icon_storage';

-- Step 8: Sample profiles after fix
SELECT 
    p.user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.icon_storage,
    CASE 
        WHEN p.user_id IS NOT NULL THEN '✅ Linked'
        ELSE '❌ Still NULL'
    END as status
FROM profiles p
ORDER BY p.user_id IS NOT NULL DESC, p.email
LIMIT 10;

-- ============================================
-- OPTIONAL: Fix icon_storage if it's wrong type
-- ============================================
-- If icon_storage shows '[object Object]' it might need to be cleared
-- Only run this if needed:

-- UPDATE profiles
-- SET icon_storage = NULL
-- WHERE icon_storage = '[object Object]' OR icon_storage = '';

-- ============================================
-- SUMMARY
-- ============================================
-- After running this script:
-- 1. All profiles should have valid user_id linking to auth.users
-- 2. You can re-upload your avatar and it should work
-- 3. Avatar should display in the header
