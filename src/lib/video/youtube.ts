import { YoutubeTranscript } from "youtube-transcript";
import ytdl from "@distube/ytdl-core";
import fs from "fs";
import path from "path";

/**
 * YouTube動画の字幕を取得する（簡易的な学習データとして維持）
 */
export async function getTranscript(url: string) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    return transcript.map(t => t.text).join(" ");
  } catch (error) {
    console.warn("Transcript not found for:", url);
    return "";
  }
}

/**
 * 動画のメタデータ（タイトル等）を取得する
 */
export async function getVideoMetadata(url: string) {
  const info = await ytdl.getInfo(url);
  return {
    title: info.videoDetails.title,
    author: info.videoDetails.author.name,
    duration: info.videoDetails.lengthSeconds,
    url,
    videoId: info.videoDetails.videoId
  };
}

/**
 * YouTube動画を一時フォルダにダウンロードする
 */
export async function downloadVideo(url: string, outputPath: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. まずメタデータを再取得して詳細情報を得る
      const info = await ytdl.getInfo(url);
      
      // 2. ブラウザを模倣するヘッダーを付けてダウンロード
      // 数学の板書には720p(itag: 22)がバランスが良い。なければ最高画質を選択。
      const stream = ytdl.downloadFromInfo(info, {
        quality: "22", // 720p MP4 (Video + Audio)
        requestOptions: {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          }
        }
      });
      
      const fileStream = fs.createWriteStream(outputPath);
      
      stream.pipe(fileStream);
      
      fileStream.on("finish", () => {
        console.log("Download finished (720p priority):", outputPath);
        resolve(outputPath);
      });
      
      fileStream.on("error", (err) => {
        console.error("FileStream error:", err);
        reject(err);
      });
      
      stream.on("error", (err) => {
        console.error("ytdl stream error:", err);
        reject(err);
      });
    } catch (err) {
      console.error("downloadVideo entry error:", err);
      reject(err);
    }
  });
}

function extractVideoId(url: string): string {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : "";
}
