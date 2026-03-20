/**
 * チャット関連の型定義
 */

import type { DocumentMetadata } from "./database.types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  /** AIの回答に紐づく出典情報 */
  sources?: SourceCitation[];
  createdAt?: Date;
}

export interface SourceCitation {
  /** 出典のタイトル */
  title: string;
  /** 出典のURL */
  url: string;
  /** 類似度スコア */
  similarity: number;
  /** メタデータ */
  metadata: DocumentMetadata;
}
