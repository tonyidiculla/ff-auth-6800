# Avatar Upload Setup Guide

## Issue
Avatar upload is failing with error: "Bucket not found"

## Solution
You need to create the `profile-icon` storage bucket in your Supabase project.

## Steps to Create Storage Bucket

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xnetjsifkhtbbpadwlxy

2. Click on **Storage** in the left sidebar

3. Click **New Bucket**

4. Configure the bucket:
   - **Name**: `profile-icon`
   - **Public bucket**: ✅ Enable (so avatar images are publicly accessible)
   - **File size limit**: 5MB (optional)
   - **Allowed MIME types**: `image/*` (optional)

5. Click **Create bucket**

6. **Set up policies** (Security):
   Click on the bucket → **Policies** → Add policies:
   
   - **Upload policy** (authenticated users only):
     ```
     Name: Users can upload their own avatar
     Policy: INSERT
     Target roles: authenticated
     
     USING expression:
     auth.uid()::text = (storage.foldername(name))[1]
     ```
   
   - **Update policy** (users can update their own):
     ```
     Name: Users can update their own avatar
     Policy: UPDATE
     Target roles: authenticated
     
     USING expression:
     auth.uid()::text = (storage.foldername(name))[1]
     ```
   
   - **Read policy** (public read):
     ```
     Name: Public can view avatars
     Policy: SELECT
     Target roles: public, authenticated
     
     USING expression:
     true
     ```

### Option 2: Via SQL (Alternative)

Run this SQL in your Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-icon', 'profile-icon', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-icon' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-icon' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public, authenticated
USING (bucket_id = 'profile-icon');
```

## After Setup

1. **Test the upload**: Refresh your browser and click on your avatar to upload an image

2. **Expected behavior**:
   - Click avatar → File picker opens
   - Select image (max 5MB)
   - Upload starts (spinner shows)
   - Avatar updates automatically
   - New avatar displays in header

3. **File structure in bucket**:
   ```
   profile-icon/
     └── avatars/
         └── {userId}-{timestamp}.{ext}
   ```

## Troubleshooting

If upload still fails after creating bucket:

1. **Check bucket exists**:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'profile-icon';
   ```

2. **Check policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

3. **Check Auth service logs**:
   ```bash
   tail -50 /tmp/ff-auth-6800.log
   ```

4. **Verify icon_storage column exists in profiles table**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'icon_storage';
   ```
   
   If missing, add it:
   ```sql
   ALTER TABLE profiles ADD COLUMN icon_storage TEXT;
   ```
