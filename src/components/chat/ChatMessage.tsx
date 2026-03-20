import React from "react";
import { Message } from "ai";
import { VideoSource } from "./VideoSource";

interface ChatMessageProps {
  message: Message;
  sources?: any[];
  onSourceClick?: (src: any) => void;
  activeUrl?: string;
  activeStartTime?: number;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  sources, 
  onSourceClick,
  activeUrl,
  activeStartTime
}) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-lg mr-3 mt-1 shadow-sm overflow-hidden border-2 border-white">
          {/* 本来は宇佐見さんのアイコン画像を入れる */}
          <span className="font-bold">す</span>
        </div>
      )}
      <div className={`flex flex-col max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-5 py-4 whitespace-pre-wrap leading-relaxed shadow-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>

        {/* 出典表示エリア */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3 w-full max-w-sm">
            <div className="text-[10px] font-bold text-slate-400 mb-2 tracking-wider uppercase ml-1">
              Reference Scenes
            </div>
            <div className="grid grid-cols-1 gap-2">
              {sources.map((src, i) => (
                <VideoSource 
                  key={i}
                  title={src.title}
                  url={src.url}
                  startTime={src.startTime}
                  onClick={() => onSourceClick?.(src)}
                  isActive={src.url === activeUrl && src.startTime === activeStartTime}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
