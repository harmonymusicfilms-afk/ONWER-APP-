-- NEXORA SALON OS - CHAT STORAGE SETUP
-- Run this in your Supabase SQL Editor to configure storage for chat images.

-- 1. Create chat-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS for chat-images bucket
-- Note: Requires enabling RLS on storage.objects if not already enabled.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload to chat-images
CREATE POLICY "Allow authenticated users to upload to chat-images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'chat-images' AND
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM public.chat_threads
        WHERE id::text = split_part(name, '/', 1)
        AND (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()))
    )
);

-- Policy: Allow authenticated users to view images in their chat threads
CREATE POLICY "Allow authenticated users to view images in their chat threads" ON storage.objects
FOR SELECT USING (
    bucket_id = 'chat-images' AND
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM public.chat_threads
        WHERE id::text = split_part(name, '/', 1)
        AND (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()))
    )
);
