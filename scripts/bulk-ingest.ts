import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import os from "os";

// .env.localから環境変数を読み込む (ローカル開発用)
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// 必要な関数をインポート
import { getVideoMetadata, downloadVideo } from "../src/lib/video/youtube";
import { analyzeVideoSegments, genAI } from "../src/lib/ai/gemini";
import { generateEmbedding } from "../src/lib/ai/embedding";
import { supabaseAdmin } from "../src/lib/supabase/admin";

/**
 * 動画1本を学習する
 */
async function processVideo(url: string) {
    const tmpDir = path.join(os.tmpdir(), `subaru-ingest-${Date.now()}`);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const videoPath = path.join(tmpDir, "video.mp4");

    try {
        console.log(`\n--- Processing Video: ${url} ---`);
        
        // 1. メタデータ取得
        const metadata = await getVideoMetadata(url);
        console.log(`Title: ${metadata.title}`);

        // すでに学習済みかチェック (簡易)
        const { data: existing } = await supabaseAdmin
            .from("documents")
            .select("id")
            .eq("video_url", url)
            .limit(1);
        
        if (existing && existing.length > 0) {
            console.log("⚠️ This video is already indexed. Skipping.");
            return;
        }

        // 2. ダウンロード
        console.log("Downloading video...");
        await downloadVideo(url, videoPath);

        // 3. Geminiによる解析
        console.log("Analyzing via Gemini Video API...");
        const segments = await analyzeVideoSegments(videoPath, "video/mp4");

        // 4. ベクトル化とDB保存
        console.log(`Embedding ${segments.length} segments...`);
        const records = [];
        for (const seg of segments) {
            try {
                const embedding = await generateEmbedding(seg.description);
                records.push({
                    description: seg.description,
                    metadata: { ...metadata, has_visual: true },
                    video_url: url,
                    start_time: seg.start_time,
                    end_time: seg.end_time,
                    embedding
                });
            } catch (e) {
                console.error(`Failed to embed segment at ${seg.start_time}s`);
            }
        }

        console.log(`Saving ${records.length} records to Supabase...`);
        const { error } = await supabaseAdmin.from("documents").upsert(records);
        if (error) throw error;

        console.log("✅ Success!");

    } catch (err: any) {
        console.error("❌ ERROR Processing Video:", err.message);
    } finally {
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    }
}

/**
 * メイン処理
 */
async function main() {
    const args = process.argv.slice(2);
    const targetUrl = args[0];

    if (targetUrl) {
        // 特定のURLが指定された場合
        await processVideo(targetUrl);
    } else {
        // TODO: ここに最新動画取得ロジックなどを入れる予定
        console.log("Please provide a YouTube URL as an argument.");
        console.log("Usage: npm run ingest -- <YOUTUBE_URL>");
    }
}

main().catch(console.error);
