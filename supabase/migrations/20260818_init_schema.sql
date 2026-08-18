-- ==========================================
-- AS Secure — Supabase Database & Storage Setup
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

-- 2. Enable Row Level Security (RLS) on Documents Table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 3. Define Strictly User-Isolated RLS Policies for Documents Table
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

-- 4. Create Public Storage Bucket 'documents'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Enable Storage Access Policies for storage.objects
CREATE POLICY "Allow public access for documents bucket" 
    ON storage.objects FOR ALL 
    USING (bucket_id = 'documents') 
    WITH CHECK (bucket_id = 'documents');
