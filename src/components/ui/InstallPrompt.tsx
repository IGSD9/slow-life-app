"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto">
      <div className="bg-[#fff0f6] border border-[#ff6b9d]/40 rounded-xl p-3 flex items-center gap-3 shadow-lg">
        <Download size={20} className="text-[#ff6b9d] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold">ホーム画面に追加</p>
          <p className="text-[10px] text-[#9494b0]">アプリのように快適にプレイ</p>
        </div>
        <Button size="sm" onClick={install}>追加</Button>
        <button onClick={() => setDismissed(true)} className="text-[#8888a8]">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
