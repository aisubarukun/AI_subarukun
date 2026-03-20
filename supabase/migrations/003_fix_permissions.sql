-- このSQLは、documentsテーブルに書き込み権限がないエラーを強制的に修正するものです。
-- SupabaseのSQL Editorに貼り付けてRUNしてください。

GRANT ALL ON TABLE documents TO anon, authenticated, service_role;

-- もしシーケンス等が原因だった場合のための念押し
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
