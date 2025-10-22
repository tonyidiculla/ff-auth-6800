-- Update Tony's profile with name
-- Run this in Supabase SQL Editor or via psql

UPDATE public.profiles
SET 
  first_name = 'Tony',
  last_name = 'Idiculla',
  updated_at = NOW()
WHERE email = 'tony@fusionduotech.com';

-- Verify the update
SELECT 
  email,
  first_name,
  last_name,
  avatar_storage,
  updated_at
FROM public.profiles
WHERE email = 'tony@fusionduotech.com';
