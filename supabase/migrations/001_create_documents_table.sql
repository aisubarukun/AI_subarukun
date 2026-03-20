-- ============================================
-- Migration 001: pgvector拡張の有効化 & documentsテーブルの作成
-- ============================================
-- 使い方: Supabaseダッシュボード > SQL Editor にこのSQLを貼り付けて実行

-- 1. pgvector 拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. documents テーブルの作成
-- Voyage AI voyage-3 の出力次元数 = 1024
CREATE TABLE IF NOT EXISTS documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}'::jsonb,
  embedding  vector(1024),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ベクトル検索のパフォーマンス向上のためのインデックス
-- ivfflat インデックスはデータが一定量以上入ってから作成するのが推奨
-- 初期段階ではコメントアウトしておき、データ件数が増えたら有効化する
-- CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE documents IS '教材テキストのチャンクとそのベクトル埋め込みを保存するテーブル';
COMMENT ON COLUMN documents.content IS '教材テキストの分割チャンク';
COMMENT ON COLUMN documents.metadata IS 'メタデータ (出典URL、動画タイトル等)';
COMMENT ON COLUMN documents.embedding IS 'Voyage AI (voyage-3) で生成されたベクトル (1024次元)';
