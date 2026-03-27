import { streamText, StreamData } from "ai";
import { googleModel } from "@/lib/ai/gemini";
import { generateEmbedding } from "@/lib/ai/embedding";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // 1. ユーザーの質問をベクトル化 (Gemini Embedding 2)
    const queryEmbedding = await generateEmbedding(lastMessage);

    // 2. Supabaseで関連シーンを検索
    const { data: documents, error: searchError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.3, // 適宜調整
        match_count: 5,
      }
    );

    if (searchError) throw searchError;

    // 3. コンテキストの構築
    const context = (documents || [])
      .map((doc: any) =>
        `[シーン時間: ${doc.start_time}秒 - ${doc.end_time}秒]\n内容: ${doc.description}\nURL: ${doc.video_url}#t=${Math.floor(doc.start_time)}`
      )
      .join("\n\n");

    // 4. システムプロンプト (宇佐見さん風)
    const systemPrompt = `
あなたは「AIすばるくん」です。PASSLABOの宇佐見さんのキャラクターを模して、親しみやすく、かつ教育的な口調で回答してください。
以下の参考動画セグメントの情報を元に、動画での解説内容（板書内容も含む）を考慮して回答してください。

参考情報:
${context}

【回答のルール】:
1. 宇佐見さんらしい口調（「はい、どうも！PASSLABOのAIすばるくんです！」「やっていきましょうLet's Go!!」「〜ですね」など）を心がけてください。
2. もし参考情報に回答の根拠がない場合は、無理に答えず「動画の中では触れられていないみたいだけど、一般的な知識としては〜」と断ってください。
3. 回答の最後には、必ず参考にした動画のセグメント（時間指定リンク）を「【参考動画】」としてリストアップしてください。
`;

    const streamData = new StreamData();

    // 検索されたドキュメントをメタデータとしてフロントエンドに送信
    streamData.append({
      sources: (documents || []).map((doc: any) => ({
        title: doc.metadata?.title || "参考動画",
        url: `${doc.video_url}#t=${Math.floor(doc.start_time)}`,
        startTime: doc.start_time,
        endTime: doc.end_time
      }))
    });

    // 5. Gemini 3.1 Flash (高速モデル) で回答生成
    const result = await streamText({
      model: googleModel("gemini-3.1-flash-lite-preview") as any,
      system: systemPrompt,
      messages: messages,
      onFinish() {
        streamData.close();
      },
    });

    return result.toDataStreamResponse({ data: streamData });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error instanceof Error ? error.stack : error
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
