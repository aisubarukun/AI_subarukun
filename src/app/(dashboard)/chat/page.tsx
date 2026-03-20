"use client";

import { useChat, Message } from "ai/react";
import { SendIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, data, error } = useChat({
    api: "/api/chat", // RAG用エンドポイント
  });

  const [activeSource, setActiveSource] = useState<{title: string, url: string, startTime: number} | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // メッセージが追加されたら一番下までスクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Form送信イベントをシミュレート
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  // YouTubeの動画IDを抽出して埋め込みURLを生成
  const getEmbedUrl = (url: string, startTime: number) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[7].length === 11) ? match[7] : "";
    return `https://www.youtube.com/embed/${videoId}?start=${Math.floor(startTime)}&autoplay=1`;
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* メインチャットエリア */}
      <div className={`flex flex-col h-full bg-white shadow-sm border-r border-slate-200 transition-all duration-300 ${activeSource ? "w-1/2" : "flex-1 max-w-4xl mx-auto"}`}>
        <header className="py-4 px-6 border-b border-slate-200 flex items-center justify-between bg-white z-10">
          <h1 className="text-xl font-bold text-slate-800">AIすばるくん</h1>
          <div className="text-sm text-slate-500">MVP版</div>
        </header>

        {/* メッセージ表示エリア */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-4xl text-blue-400">👋</span>
              </div>
              <p className="text-center font-medium">やっていきましょう！</p>
              <p className="text-center max-w-xs text-xs text-slate-400 leading-relaxed">
                PASSLABOの動画に基づいた学習サポートを行います。<br/>質問を入力してください。
              </p>
            </div>
          ) : (
            messages.map((m: Message) => {
              const isLastAiMessage = m.role === "assistant" && m.id === messages.filter(msg => msg.role === 'assistant').pop()?.id;
              const sources = (isLastAiMessage && data && data.length > 0) 
                  ? (data[data.length - 1] as any).sources 
                  : undefined;

              return (
                <ChatMessage 
                  key={m.id} 
                  message={m} 
                  sources={sources} 
                  onSourceClick={setActiveSource}
                  activeUrl={activeSource?.url}
                  activeStartTime={activeSource?.startTime}
                />
              );
            })
          )}

          {isLoading && !messages.some(m => m.role === "assistant" && !m.content) && (
            <div className="flex justify-start">
               <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-400 mr-3 animate-pulse">
                 す
               </div>
               <div className="bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center space-x-1.5 shadow-sm">
                 <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                 <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
               </div>
            </div>
          )}
        </div>

        {/* 入力フォーム */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSubmit} className="relative flex items-end max-w-3xl mx-auto">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="AIすばるくんに質問する..."
              className="w-full resize-none rounded-xl border border-slate-300 bg-white pl-4 pr-12 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
              rows={1}
              style={{ minHeight: "52px", maxHeight: "200px" }}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="absolute right-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 w-9 flex items-center justify-center disabled:opacity-50 transition-colors"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* ビデオプレーヤーエリア (条件付き表示) */}
      {activeSource && (
        <div className="flex-1 flex flex-col h-full bg-slate-900 border-l border-slate-800 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
            <h3 className="text-white font-bold text-sm truncate pr-4">{activeSource.title}</h3>
            <button 
              onClick={() => setActiveSource(null)}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={getEmbedUrl(activeSource.url, activeSource.startTime)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
          <div className="p-6 bg-slate-900/50 text-slate-300 text-xs">
            <p className="font-bold mb-1 text-slate-100">AIが参考にしたシーン</p>
            <p>再生開始時間: {Math.floor(activeSource.startTime / 60)}分 {Math.floor(activeSource.startTime % 60)}秒</p>
          </div>
        </div>
      )}
    </div>
  );
}
