-- ============================================
-- Migration 004: 動画マルチモーダルRAGへの移行
-- ============================================

-- 1. カラム名の変更 (content -> description)
ALTER TABLE documents RENAME COLUMN content TO description;

-- 2. 動画セグメント情報のカラム追加 (metadataの重複を避ける)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS start_time FLOAT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS end_time FLOAT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. ベクトル次元の変更
-- Gemini Embedding V4/マルチモーダル埋め込みは通常768次元
ALTER TABLE documents DROP COLUMN IF EXISTS embedding;
ALTER TABLE documents ADD COLUMN embedding vector(768);

-- 4. 既存のRPC (match_documents) の更新
-- 引数のベクトル次元を768に変更
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  description text,
  metadata jsonb,
  start_time float,
  end_time float,
  video_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.description,
    documents.metadata,
    documents.start_time,
    documents.end_time,
    documents.video_url,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

COMMENT ON TABLE documents IS '動画セグメントとそのマルチモーダル埋め込みを保存するテーブル';
