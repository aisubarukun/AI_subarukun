import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/ai/embedding";
import { genAI } from "@/lib/ai/gemini";
import { sendMessage } from "@/lib/chatwork/client";
import type { ChatworkWebhookPayload } from "@/types/chatwork";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ボット自身のアカウントID（Chatworkのボット設定画面で確認できる）
const BOT_ACCOUNT_ID = process.env.CHATWORK_BOT_ACCOUNT_ID ?? "";

export async function POST(req: NextRequest) {
  // Webhook Tokenの検証
  const token = req.headers.get("X-ChatWorkWebhookToken");
  if (token !== process.env.CHATWORK_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: ChatworkWebhookPayload = await req.json();
  const { room_id, account_id, body } = payload.webhook_event;

  // ボット自身の発言は無視（無限ループ防止）
  if (String(account_id) === BOT_ACCOUNT_ID) {
    return NextResponse.json({ ok: true });
  }

  // 即座に200を返す（Chatworkのタイムアウト対策）
  const response = NextResponse.json({ ok: true });

  // バックグラウンドでRAG処理＆返信
  (async () => {
    try {
      // 1. 質問をベクトル化
      const queryEmbedding = await generateEmbedding(body);

      // 2. 関連する動画シーンを検索
      const { data: documents, error } = await supabase.rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 5,
      });

      if (error) throw error;

      // 3. コンテキスト構築
      const context = (documents || [])
        .map(
          (doc: any) =>
            `[シーン: ${doc.start_time}秒 - ${doc.end_time}秒]\n内容: ${doc.description}\nURL: ${doc.video_url}#t=${Math.floor(doc.start_time)}`
        )
        .join("\n\n");

      // 4. Geminiで回答生成
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
あなたは「AIすばるくん」です。PASSLABOの宇佐見さんのキャラクターを模して、親しみやすく教育的な口調で回答してください。

以下の参考動画セグメントを元に回答してください：
${context || "（関連する動画情報が見つかりませんでした）"}

【回答ルール】
1. 宇佐見さんらしい口調（「はい、どうも！AIすばるくんです！」「やっていきましょうLet's Go!!」など）を心がけてください。
2. 参考情報に根拠がない場合は「動画では触れられていないけど、一般的には〜」と断ってください。
3. 回答の最後に参考動画のリンクを「【参考動画】」としてリストアップしてください。

ユーザーの質問：${body}
`;

      const result = await model.generateContent(prompt);
      const replyText = result.response.text();

      // 5. Chatworkに返信
      await sendMessage(room_id, replyText);
    } catch (err) {
      console.error("[Chatwork Bot] Error:", err);
      await sendMessage(room_id, "すみません、エラーが発生してしまいました。もう一度試してみてください。").catch(() => {});
    }
  })();

  return response;
}
