import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/ai/embedding";
import { getTranscript, getVideoMetadata, downloadVideo } from "@/lib/video/youtube";
import { describeImageContent, analyzeVideoSegments } from "@/lib/ai/gemini";
import { extractFrames } from "@/lib/video/processor";
import path from "path";
import fs from "fs";
import os from "os";

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const tmpDir = path.join(os.tmpdir(), `subaru-ingest-${Date.now()}`);
  
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 1. メタデータと字幕の取得 (ここは同期)
    console.log("Fetching metadata...");
    const metadata = await getVideoMetadata(url);
    // const transcript = await getTranscript(url); // 必要に応じて

    // 2. 動画のダウンロードと解析をバックグラウンドで開始
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const videoPath = path.join(tmpDir, "video.mp4");

    // レスポンスを即座に返す (タイムアウト対策)
    const response = NextResponse.json({ 
        success: true, 
        message: "Video download and AI analysis started in background.",
        videoId: metadata.videoId,
        title: metadata.title
    });

    // バックグラウンド処理の開始
    (async () => {
        try {
            console.log(`[Background] Downloading video: ${metadata.title}`);
            await downloadVideo(url, videoPath);

            console.log("[Background] Analyzing video via Gemini Video API...");
            // Geminiに動画をまるごと渡して解析 (画像切り出し不要！)
            const segments = await analyzeVideoSegments(videoPath, "video/mp4");

            console.log(`[Background] Processing ${segments.length} segments...`);
            const records = [];
            
            // 各セグメントのテキストをベクトル化 (5件ずつ並列)
            const CONCURRENCY = 5;
            for (let i = 0; i < segments.length; i += CONCURRENCY) {
                const chunk = segments.slice(i, i + CONCURRENCY);
                const chunkPromises = chunk.map(async (seg: any) => {
                    try {
                        const embedding = await generateEmbedding(seg.description);
                        return {
                            description: seg.description,
                            metadata: { 
                                ...metadata, 
                                has_visual: true 
                            },
                            video_url: url,
                            start_time: seg.start_time,
                            end_time: seg.end_time,
                            embedding
                        };
                    } catch (e) {
                        console.error("Embedding error for segment:", e);
                        return null;
                    }
                });
                const chunkResults = await Promise.all(chunkPromises);
                records.push(...chunkResults.filter(r => r !== null));
            }

            // Supabaseに一括保存
            console.log(`[Background] Saving ${records.length} records to Supabase...`);
            const { error } = await supabase
                .from("documents")
                .upsert(records);

            if (error) throw error;
            console.log(`[Background] Successfully indexed: ${metadata.title}`);

        } catch (error: any) {
            console.error("[Background] Ingest Error:", error);
        } finally {
            // クリーンアップ
            if (fs.existsSync(tmpDir)) {
                try {
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    console.log("[Background] Temporary files cleaned up.");
                } catch (e) {
                    console.error("Cleanup error:", e);
                }
            }
        }
    })();

    return response;
  } catch (error: any) {
    console.error("Ingest API entry error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
