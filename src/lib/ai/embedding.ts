import { genAI } from "./gemini";

/**
 * テキストからベクトル（768次元）を生成する
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2-preview" });

  try {
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Gemini Embedding Error:", error);
    throw error;
  }
}
