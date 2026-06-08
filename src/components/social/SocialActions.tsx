"use client";

import { useState } from "react";
import { Shirt, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AvatarConfig } from "@/types/avatar";

interface SocialActionsProps {
  targetUserId: string;
  avatarConfig: AvatarConfig;
  onShareOutfit: (config: AvatarConfig) => void;
  onSendStamp?: (stampId: string, gridX: number, gridY: number) => void;
  playerPos: { gridX: number; gridY: number };
}

export function SocialActions({
  targetUserId,
  avatarConfig,
  onShareOutfit,
  onSendStamp,
  playerPos,
}: SocialActionsProps) {
  const [message, setMessage] = useState("");

  const shareOutfit = async () => {
    setMessage("");
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "share_outfit",
        targetUserId,
      }),
    });
    if (res.ok) {
      onShareOutfit(avatarConfig);
      setMessage("コーデを共有しました！");
    } else {
      setMessage("共有に失敗しました");
    }
  };

  const sendStamp = async () => {
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_stamp", targetUserId }),
    });
    if (res.ok) {
      onSendStamp?.("stamp_heart_01", playerPos.gridX, playerPos.gridY);
      setMessage("スタンプを送りました！");
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" onClick={shareOutfit} className="flex-1">
        <Shirt size={14} className="mr-1" />
        コーデを見せる
      </Button>
      {onSendStamp && (
        <Button size="sm" variant="secondary" onClick={sendStamp} className="flex-1">
          <Heart size={14} className="mr-1" />
          スタンプ
        </Button>
      )}
      {message && (
        <p className="text-[10px] text-[#e94560] absolute -bottom-5 left-0 right-0 text-center">
          {message}
        </p>
      )}
    </div>
  );
}
