import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

// 1. Google SDK (直接呼び出し用)
const genAI = new GoogleGenerativeAI(apiKey);
// 2. File Manager (動画アップロード用)
const fileManager = new GoogleAIFileManager(apiKey);

// 3. Vercel AI SDK Google Provider (streamText用)
export const googleModel = createGoogleGenerativeAI({
  apiKey,
});

/**
 * 画像の内容を言語化する (Gemini 1.5/2.0 Flash)
 */
export async function describeImageContent(fileBase64: string, mimeType: string, prompt: string = "この画像の内容（特に板書の文字や図解）を詳しく日本語で説明してください。") {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: fileBase64,
        mimeType
      }
    }
  ]);

  return result.response.text();
}

/**
 * 動画ファイルをGeminiに直接アップロードして解析する (最新の効率的な方法)
 */
export async function analyzeVideoSegments(filePath: string, mimeType: string) {
    // 1. ファイルをアップロード
    console.log("Uploading video to Gemini File API...");
    const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType,
        displayName: "Math Lecture Video",
    });

    // 2. アップロード完了まで待機 (動画の場合は必要)
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === "PROCESSING") {
        console.log("Waiting for video processing...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === "FAILED") {
        throw new Error("Video processing failed at Google's side.");
    }

    console.log("Video is ready for analysis!");

    // 3. 動画を10秒ごとに解析するように指示 (JSON形式で抽出)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `
        この動画は数学または物理の授業動画です。
        動画全体を詳しく「10秒ごと」のセグメントに分け、各シーンで黒板に書かれている内容、数式、講師が説明しているポイントを日本語で要約してください。
        
        必ず以下のJSON形式の配列で返してください（余計な文字は一切含めないでください）:
        [
          { "start_time": 0, "end_time": 10, "description": "要約内容..." },
          { "start_time": 10, "end_time": 20, "description": "要約内容..." }
        ]
    `;

    const result = await model.generateContent([
        {
            fileData: {
                mimeType: file.mimeType,
                fileUri: file.uri,
            },
        },
        { text: prompt },
    ]);

    const textResponse = result.response.text();
    // JSON部分を抽出 (Markdownのコードブロックなどを除去)
    const jsonStr = textResponse.match(/\[[\s\S]*\]/)?.[0] || textResponse;
    return JSON.parse(jsonStr);
}

export { genAI, fileManager };
