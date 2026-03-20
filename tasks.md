# AIすばるくん 移行 & 動画学習実装タスクリスト

## 前提条件
- 現在Next.js + Supabase + Claude/Voyageで実装されているコードベースを、Google Geminiに統一する。
- ターゲットアーキテクチャ: `architecture_gemini.md` を参照のこと。

## Phase 1: SDKの入れ替えと環境設定
### Task 1.1: パッケージの整理とGoogle SDKの導入
- **作業内容**:
  1. `package.json` から `@anthropic-ai/sdk`, `@voyageai/sdk` を削除 (`npm uninstall`)。
  2. `@google/generative-ai`, `@ai-sdk/google` (Vercel AI SDK用) をインストール。
- **完了条件**: ビルドエラーが出ないこと。

### Task 1.2: 環境変数の更新
- **作業内容**:
  1. `.env.local` から Claude/Voyage のキーを削除。
  2. `GOOGLE_GENERATIVE_AI_API_KEY` を追加し、Google AI Studioで発行したキーを設定。
- **完了条件**: 次のタスクでGoogle APIが叩けること。

## Phase 2: Supabase DBのマイグレーション（動画対応）
### Task 2.1: `documents` テーブルの改修
- **作業内容**:
  1. 既存の `documents` テーブル（テキスト検索用）を、動画シーン検索用に変更するマイグレーションを実行。
  2. `content` (text) を `description` (text, AIが生成したシーンのテキスト説明) に変更。
  3. `metadata` (jsonb) に、`start_time` (float, 開始秒数), `end_time` (float, 終了秒数) カラムを追加。
  4. `embedding` (vector) カラムの次元数がGemini Embedding 2と合致しているか確認（例: 768次元等、モデルの設定に合わせる）。
- **完了条件**: DB Schemaが動画セグメントを保存できる形式になっていること。

## Phase 3: マルチモーダル・インジェスト（動画学習）の実装
*ここが一番重いタスクです。Antigravityが安定している時に行ってください。*
### Task 3.1: 動画前処理ロジックの作成
- **作業内容**:
  1. YouTube URLから動画（MP4等）をダウンロードする（またはストリーミング処理する）ライブラリを導入（例: `ytdl-core` の2026年版など）。
  2. ダウンロードした動画を、数秒（例: 5秒）ごとのセグメントに分割、または該当するフレーム画像を抽出するロジック（例: `ffmpeg` のNode.jsバインディング）を作成。
- **完了条件**: 指定したYouTube動画から、一定間隔で画像フレームが抽出できること。

### Task 3.2: Gemini Embedding 2 によるマルチモーダル埋め込みの実装
- **作業内容**:
  1. Task 3.1で抽出した「画像フレーム」と、対応する「音声データ」をセットにして Gemini Embedding 2 API に送信するユーティリティを作成。
  2. APIから返ってきた統合ベクトル（マルチモーダルベクトル）を取得。
- **完了条件**: 画像と音声を渡して、正常にベクトル配列が返ってくること。

### Task 3.3: データ登録API (`/api/ingest`) の書き換え
- **作業内容**:
  1. 既存のインジェストAPIを完全に書き換える。
  2. YouTube URLから前処理（Task 3.1）を実行。
  3. 各セグメントを埋め込み（Task 3.2）。
  4. Vector, Description, URL, start_time, end_time を Supabase に一括保存（upsert）する。
- **完了条件**: 1本のYouTube動画のURLをPOSTすると、DBに数百件のベクトルデータ（シーンごとのメタデータ付き）が保存されること。

## Phase 4: RAGチャットロジックのGemini移行 (BFF)
### Task 4.1: Geminiによる類似シーン検索の実装 (`/api/chat` 前半)
- **作業内容**:
  1. ユーザーの質問（テキスト）を Gemini Embedding 2 でベクトル化。
  2. Supabase の `match_documents` (RPC) を呼び出し、関連する動画セグメントを検索。
- **完了条件**: 質問送信時、サーバー側で関連する「動画URL + 開始秒数」が特定できていること。

### Task 4.2: Geminiによる回答生成と出典表示の実装 (`/api/chat` 後半)
- **作業内容**:
  1. Vercel AI SDK の `streamText` をGoogle Provider (`gemini-3.1-pro-high`) に切り替える。
  2. プロンプトを構築: 「あなたはAIすばるくん（宇佐見さん風）です。検索された動画セグメントの情報を元に、板書内容を含めて回答してください。【参考動画セグメント】: {context}」。
  3. 生成された回答の末尾に、検索結果から得られた `youtube_url#t=start_time` という形式の再生リンクを自動的に追加して、フロントにストリーミングする。
- **完了条件**: UI上でAIの回答がストリーミングされ、回答の末尾に「参考にした動画の〇分〇秒」へのリンクが正しく表示され、クリックして再生できること。