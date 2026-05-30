-- ============================================================
-- game-film Storage Bucket — Public Read + Auth Write
-- Run once in Supabase SQL Editor (idempotent)
-- ============================================================

-- 1. Create bucket (public = true enables getPublicUrl without signing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-film', 'game-film', true)
ON CONFLICT (id) DO UPDATE SET public = true; -- ensure it's marked public even if bucket already existed

-- 2. Public read — anyone can stream/download video via the public URL
--    (Required for the video player to load src= without auth tokens)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'game-film: public read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "game-film: public read"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'game-film')
    $policy$;
  END IF;
END $$;

-- 3. Authenticated upload — only signed-in users can add files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'game-film: authenticated upload'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "game-film: authenticated upload"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'game-film')
    $policy$;
  END IF;
END $$;

-- 4. Authenticated delete — only signed-in users can remove their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'game-film: authenticated delete'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "game-film: authenticated delete"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'game-film')
    $policy$;
  END IF;
END $$;
