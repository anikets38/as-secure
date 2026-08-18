-- ==========================================
-- AS Secure — Supabase Database Migration
-- ==========================================

-- 1. Create Documents Metadata Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category_id TEXT DEFAULT 'cat_other',
    tags TEXT[] DEFAULT '{}',
    storage_path TEXT NOT NULL,
    mime_type TEXT DEFAULT 'application/octet-stream',
    file_size BIGINT DEFAULT 0,
    encryption_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 3. Define Strictly User-Isolated RLS Policies
CREATE POLICY "Users can view own document metadata"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document metadata"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document metadata"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own document metadata"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Storage Bucket Setup Instructions & Storage RLS
-- Create private bucket 'documents' in Supabase Dashboard (Public = false)
-- Apply the following policies on storage.objects:

/*
CREATE POLICY "Users can upload encrypted files to own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can read encrypted files from own folder"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete encrypted files from own folder"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
*/
