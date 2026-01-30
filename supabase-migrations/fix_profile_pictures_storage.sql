-- Fix storage policies for profile pictures
-- Run this to fix RLS errors when uploading profile pictures

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly accessible" ON storage.objects;

-- Create new policies that check filename starts with user ID
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  name LIKE auth.uid()::text || '-%'
);

CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  name LIKE auth.uid()::text || '-%'
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  name LIKE auth.uid()::text || '-%'
);

CREATE POLICY "Users can delete their own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  name LIKE auth.uid()::text || '-%'
);

CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
