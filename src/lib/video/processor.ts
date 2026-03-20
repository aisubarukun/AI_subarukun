import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

/**
 * 動画から一定間隔で画像を抽出する処理（要ffmpeg）
 */
export async function extractFrames(videoPath: string, outputDir: string, intervalSeconds: number = 5) {
  // ffmpegがインストールされているか確認
  try {
    await execAsync("ffmpeg -version");
  } catch (e) {
    throw new Error("ffmpeg is not installed. Please install it to use multimodal features.");
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPattern = path.join(outputDir, "frame-%03d.jpg");
  
  // 5秒ごとに1フレーム抽出
  const command = `ffmpeg -i "${videoPath}" -vf fps=1/${intervalSeconds} "${outputPattern}"`;
  
  await execAsync(command);
  
  return fs.readdirSync(outputDir)
    .filter(f => f.endsWith(".jpg"))
    .map(f => path.join(outputDir, f));
}

/**
 * 動画から音声のみ抽出する処理
 */
export async function extractAudio(videoPath: string, outputPath: string) {
  const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame "${outputPath}"`;
  await execAsync(command);
  return outputPath;
}
