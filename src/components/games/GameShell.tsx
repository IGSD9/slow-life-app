"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReactNode } from "react";

interface GameShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  /** 4:3 固定 / fill=親いっぱい */
  aspect?: "4/3" | "fill";
}

export function GameShell({
  title,
  subtitle,
  children,
  backHref = "/room",
  aspect = "4/3",
}: GameShellProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#080810]">
      <header
        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b-4 border-[#483830]"
        style={{
          background: "linear-gradient(180deg, #302830 0%, #201820 100%)",
          boxShadow: "inset 0 -2px 0 #68c84840",
        }}
      >
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="text-[#c8d8c0] hover:text-[#68c848]">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1
            className="text-sm font-bold text-[#68c848] truncate"
            style={{ textShadow: "1px 1px 0 #201820" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] text-[#9494b0] truncate leading-tight">{subtitle}</p>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-3">
        <div
          className={
            aspect === "fill"
              ? "relative w-full h-full"
              : "relative w-full h-full max-w-[960px] mx-auto"
          }
          style={aspect === "4/3" ? { aspectRatio: "4/3", maxHeight: "100%" } : undefined}
        >
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              background: "#0a0a14",
              border: "4px solid #483830",
              boxShadow: "inset 0 0 0 2px #886040, inset 0 0 24px #00000080, 0 6px 0 #201820",
            }}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

/** キャンバスゲームをコンテナいっぱいにスケール表示 */
export function GameCanvasViewport({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
      <div className="w-full h-full flex items-center justify-center [&_canvas]:max-w-full [&_canvas]:max-h-full [&_canvas]:w-auto [&_canvas]:h-auto [&_canvas]:object-contain">
        {children}
      </div>
    </div>
  );
}
