# AIすばるくん システムアーキテクチャ (Gemini マルチモーダル版)

## 概要
PASSLABOのYouTube動画を直接「映像・音声・テキスト」として学習し、板書内容まで含めた回答を行う「マルチモーダルRAG」システム。

## 技術スタック
- **Frontend/BFF**: Next.js (App Router), Vercel AI SDK (Google Provider)
- **DB/Auth**: Supabase (PostgreSQL + pgvector)
- **AI Models**: 
  - Gemini 3.1 Pro (推理・回答)
  - Gemini Embedding 2 (マルチモーダル埋め込み)

## ファイル＆フォルダ構成 (修正版)
```text
ai-subaru-kun/
├── src/
│   ├── app/
│   │   ├── (dashboard)/            
│   │   │   ├── chat/
│   │   │   │   └── page.tsx        # 宇佐見さんアイコン付きチャット画面
│   │   │   └── layout.tsx          
│   │   ├── api/
│   │   │   ├── chat/route.ts       # Gemini 3.1 Pro + RAG検索ロジック
│   │   │   └── ingest/route.ts     # 動画URLからベクトル化・保存する重い処理
│   │   ├── globals.css
│   │   └── layout.tsx              
│   ├── components/                 
│   │   ├── chat/
│   │   │   ├── ChatMessage.tsx     
│   │   │   ├── ChatInput.tsx       
│   │   │   └── VideoSource.tsx     # 【追加】YouTube再生(特定秒数)へのリンクUI
│   │   └── ui/                     
│   ├── lib/                        
│   │   ├── supabase/               # Supabase接続設定
│   │   ├── ai/
│   │   │   ├── gemini.ts           # 【修正】Google SDKの初期化設定
│   │   │   └── embedding.ts        # 【修正】Gemini Embedding 2用ロジック
│   │   ├── video/
│   │   │   ├── processor.ts        # 【新規】動画からフレーム抽出・音声分離する処理
│   │   │   └── youtube.ts          # 【新規】YouTube動画のダウンロード・メタデータ取得
│   │   └── utils.ts                
│   └── types/                      
│       ├── database.types.ts       
│       └── video.ts                # 【新規】動画セグメント(start_time等)の型定義
├── .env.local                      # GOOGLE_GENERATIVE_AI_API_KEY を設定
├── next.config.mjs
└── tailwind.config.ts