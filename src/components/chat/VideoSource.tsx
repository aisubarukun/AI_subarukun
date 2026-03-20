import React from "react";
import { PlayCircle, ExternalLink } from "lucide-react";

interface VideoSourceProps {
  title: string;
  url: string;
  startTime: number;
  onClick?: () => void;
  isActive?: boolean;
}

export const VideoSource: React.FC<VideoSourceProps> = ({ title, url, startTime, onClick, isActive }) => {
  // 秒数を 分:秒 形式に変換
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      className={`w-full flex items-center p-2 rounded-lg bg-white border transition-all text-left outline-none ${
        isActive 
          ? "border-blue-500 ring-1 ring-blue-500 shadow-sm bg-blue-50/30" 
          : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
      } group`}
    >
      <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 transition-colors ${
        isActive ? "bg-blue-100" : "bg-slate-100 group-hover:bg-blue-50"
      }`}>
        <PlayCircle className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-bold truncate ${isActive ? "text-blue-700" : "text-slate-700"}`}>
          {title}
        </div>
        <div className={`text-[10px] flex items-center ${isActive ? "text-blue-500" : "text-slate-500"}`}>
          再生開始: {formatTime(startTime)}
          {isActive ? (
             <span className="ml-2 font-bold animate-pulse">Playing...</span>
          ) : (
             <ExternalLink className="w-2 h-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </button>
  );
};
