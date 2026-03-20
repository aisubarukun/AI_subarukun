-- ============================================
-- Migration 002: ベクトル類似度検索用 RPC関数の作成
-- ============================================
-- 使い方: Supabaseダッシュボード > SQL Editor にこのSQLを貼り付けて実行
-- 前提: Migration 001 が実行済みであること

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id         UUID,
  content    TEXT,
  metadata   JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_documents IS 'クエリベクトルとコサイン類似度で類似ドキュメントを検索するRPC関数';
