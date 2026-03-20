"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminIngestPage() {
  const [urls, setUrls] = useState("");
  const [statusList, setStatusList] = useState<{url: string, status: string}[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urls.trim()) return;

    const urlList = urls.split("\n").map(u => u.trim()).filter(u => u.length > 0);
    if (urlList.length === 0) return;

    setIsRunning(true);
    const newStatusList = urlList.map(u => ({ url: u, status: "⏳ 待機中..." }));
    setStatusList(newStatusList);

    for (let i = 0; i < urlList.length; i++) {
        const currentUrl = urlList[i];
        
        // UI更新 (処理中)
        setStatusList(prev => prev.map((item, idx) => 
            idx === i ? { ...item, status: "🔄 抽出＆学習中..." } : item
        ));

        try {
            const res = await fetch("/api/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: currentUrl }),
            });
            const data = await res.json();
            
            setStatusList(prev => prev.map((item, idx) => 
                idx === i ? { ...item, status: res.ok ? "✅ 学習完了" : `❌ エラー: ${data.error}` } : item
            ));
        } catch (err: any) {
            setStatusList(prev => prev.map((item, idx) => 
                idx === i ? { ...item, status: `❌ 通信エラー: ${err.message}` } : item
            ));
        }
    }

    setIsRunning(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-8 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">一括学習ページ（魔法のURLモード）</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-5 mb-8 text-sm text-slate-700 rounded-r-md">
        <h3 className="font-bold text-base mb-2 text-blue-800">✨ 裏技：URLを貼るだけで自動学習モード</h3>
        <p className="mb-2">手動コピーしなくても、以下のURLを1行に1つずつ貼り付けると、AIが自動でテキストを抽出して学習します。</p>
        <ul className="list-disc ml-5 space-y-1 mb-2">
          <li><strong>YouTube動画:</strong> URLを貼るだけで「字幕/文字起こしデータ」を裏側から自動取得します。（※字幕が許可されている動画のみ）</li>
          <li><strong>Google Docs:</strong> 共有設定が「リンクを知っている全員に公開」のGoogleドキュメントURLを貼るだけで中身を自動取得します。</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2 font-semibold">※一度にたくさん（例: 20個など）貼り付けても、順番に処理していきます。</p>
      </div>

      <form onSubmit={handleBatchSubmit} className="space-y-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            URLリスト（必ず1行につき1つのURLにしてください）
          </label>
          <textarea
            required
            className="w-full rounded-md border border-slate-300 p-3 min-h-[200px] outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder={"https://www.youtube.com/watch?v=...\nhttps://docs.google.com/document/d/..."}
          />
        </div>

        <Button 
          type="submit" 
          disabled={isRunning || !urls.trim()} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-md font-bold transition-colors disabled:bg-slate-400 text-lg shadow-sm"
        >
          {isRunning ? "自動学習を実行しています..." : "URLを一括でAIに学習させる"}
        </Button>
      </form>

      {statusList.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-bold mb-4 text-slate-800">処理状況</h3>
          <div className="space-y-3">
            {statusList.map((item, i) => (
              <div key={i} className={`p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-colors ${
                  item.status.includes("✅") ? "bg-green-50 border-green-200 text-green-800" :
                  item.status.includes("❌") ? "bg-red-50 border-red-200 text-red-800" :
                  "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <div className="text-sm font-mono truncate" style={{ maxWidth: "60%" }} title={item.url}>{item.url}</div>
                <div className="font-bold flex-shrink-0 text-sm bg-white/60 px-3 py-1.5 rounded-full">{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
