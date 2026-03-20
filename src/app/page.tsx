import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-8">
        <div>
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🤖</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">AIすばるくん</h1>
          <p className="text-slate-500">MVP版 トップページ</p>
        </div>
        
        <div className="space-y-4">
          <Link href="/chat" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-6 text-lg rounded-xl shadow-sm transition-transform hover:scale-[1.02]">
              💬 すばるくんに質問する（生徒用）
            </Button>
          </Link>

          <Link href="/admin" className="block">
            <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 p-6 text-base rounded-xl transition-colors">
              ⚙️ AIへ知識を教え込む（管理者用）
            </Button>
          </Link>
        </div>

        <div className="text-xs text-slate-400 mt-8 pt-6 border-t border-slate-100">
          まずは管理者ボタンからYoutubeURLを入れて学習させ、<br/>
          そのあとで「すばるくんに質問する」をテストしてください。
        </div>
      </div>
    </div>
  );
}
