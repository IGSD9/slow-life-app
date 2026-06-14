"use client";

import { useEffect, useRef } from "react";
import type { AvatarConfig } from "@/types/avatar";
import { resolveCharacterColors } from "@/lib/pixelCharacter";

export interface PhaserGameContainerProps {
  avatarConfig: AvatarConfig;
  itemSpriteById: Record<string, string>;
  onWin: (score: number) => void;
  onScoreChange?: (score: number) => void;
}

function hexColor(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export function PhaserGameContainer({
  avatarConfig,
  itemSpriteById,
  onWin,
  onScoreChange,
}: PhaserGameContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ onWin, onScoreChange });
  callbacksRef.current = { onWin, onScoreChange };

  useEffect(() => {
    let game: import("phaser").Game | null = null;
    let cancelled = false;

    async function boot() {
      const Phaser = await import("phaser");
      if (cancelled || !containerRef.current) return;

      const spriteMap = new Map(Object.entries(itemSpriteById));
      const colors = resolveCharacterColors(avatarConfig, spriteMap);

      class DungeonScene extends Phaser.Scene {
        private score = 0;
        private remaining = 5;

        constructor() {
          super("DungeonScene");
        }

        create() {
          const { width, height } = this.scale;
          this.cameras.main.setBackgroundColor("#1a1030");

          this.add.rectangle(width / 2, height / 2, width, height, 0x1a1030);
          this.add.rectangle(width / 2, height - 24, width, 48, 0x2d4a2d);

          const player = this.add.container(80, height - 80);
          player.add([
            this.add.rectangle(0, 18, 16, 8, hexColor(colors.shoes)),
            this.add.rectangle(0, 14, 18, 12, hexColor(colors.pants)),
            this.add.rectangle(0, 0, 20, 28, hexColor(colors.shirt)),
            this.add.circle(0, -20, 10, hexColor(colors.skin)),
          ]);
          if (avatarConfig.hat) {
            player.add(this.add.rectangle(0, -28, 16, 6, hexColor(colors.hat ?? "#f5a623")));
          }

          this.tweens.add({
            targets: player,
            y: height - 76,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });

          for (let i = 0; i < 5; i++) {
            const tx = 180 + i * 50;
            const target = this.add.rectangle(tx, height - 70, 24, 24, 0xff6b9d);
            target.setStrokeStyle(2, 0x483830);
            target.setInteractive({ useHandCursor: true });
            target.on("pointerdown", () => {
              if (!target.visible) return;
              target.setVisible(false);
              this.score += 100;
              this.remaining -= 1;
              callbacksRef.current.onScoreChange?.(this.score);
              if (this.remaining <= 0) {
                this.time.delayedCall(300, () => callbacksRef.current.onWin(this.score));
              }
            });
          }

          const cursors = this.input.keyboard?.createCursorKeys();
          this.events.on("update", () => {
            if (!cursors) return;
            if (cursors.right?.isDown && player.x < width - 40) player.x += 3;
            if (cursors.left?.isDown && player.x > 40) player.x -= 3;
          });

          this.add.text(8, 8, "冒険ダンジョン村", {
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#ff6b9d",
          });
          this.add.text(8, 26, "ターゲットをタップ！", {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#9494b0",
          });
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: 400,
        height: 280,
        backgroundColor: "#1a1030",
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: DungeonScene,
      });
    }

    boot();
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [avatarConfig, itemSpriteById]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-lg mx-auto rounded-lg overflow-hidden border-4 border-[#483830]"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
