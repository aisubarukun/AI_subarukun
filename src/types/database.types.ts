/**
 * Supabaseデータベースの型定義
 */

export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding: number[] | null;
  created_at: string;
}

export interface DocumentMetadata {
  /** 出典のURL（YouTube動画リンク等） */
  source_url?: string;
  /** 出典のタイトル（動画タイトル等） */
  title?: string;
  /** データソースの種類 */
  source_type?: "youtube" | "text" | "other";
  /** その他の任意のメタデータ */
  [key: string]: unknown;
}

/**
 * match_documents RPC の戻り値の型
 * ベクトル次元数: 1024 (Voyage AI voyage-3)
 */
export interface MatchedDocument {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  similarity: number;
}
