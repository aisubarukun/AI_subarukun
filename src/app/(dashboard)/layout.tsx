import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* サイドバーが必要な場合はここに追加 */}
      <main className="flex-1 w-full flex flex-col h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}
