"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

const W = 320;
const H = 180;
const GROUND = H - 30;

interface ScrollActionGameProps {
  onGameOver: (score: number) => void;
}

export function ScrollActionGame({ onGameOver }: ScrollActionGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({
    playerY: GROUND,
    vy: 0,
    jumping: false,
    obstacles: [] as { x: number; w: number; h: number }[],
    frame: 0,
    speed: 3,
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s.jumping && s.playerY >= GROUND) {
      s.vy = -9;
      s.jumping = true;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const s = stateRef.current;
      if (gameOver) return;

      s.frame++;
      if (s.frame % 60 === 0) {
        s.speed = Math.min(8, s.speed + 0.2);
        setScore(Math.floor(s.frame / 6));
      }

      s.vy += 0.5;
      s.playerY += s.vy;
      if (s.playerY >= GROUND) {
        s.playerY = GROUND;
        s.vy = 0;
        s.jumping = false;
      }

      if (s.frame % Math.max(40, 80 - s.speed * 5) === 0) {
        s.obstacles.push({
          x: W + 10,
          w: 14 + Math.random() * 20,
          h: 20 + Math.random() * 25,
        });
      }

      const playerX = 40;
      const playerH = 24;
      const playerW = 20;

      for (const obs of s.obstacles) {
        obs.x -= s.speed;
      }
      s.obstacles = s.obstacles.filter((o) => o.x > -50);

      for (const obs of s.obstacles) {
        const obsY = GROUND - obs.h + 30;
        if (
          playerX + playerW > obs.x &&
          playerX < obs.x + obs.w &&
          s.playerY + 30 > obsY &&
          s.playerY < obsY + obs.h
        ) {
          setGameOver(true);
          onGameOver(Math.floor(s.frame / 6));
          return;
        }
      }

      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#2d1b4e";
      ctx.fillRect(0, 0, W, H - 30);

      ctx.fillStyle = "#3d2b1f";
      ctx.fillRect(0, GROUND + 30, W, 30);

      ctx.fillStyle = "#ff6b9d";
      ctx.fillRect(playerX, s.playerY, playerW, playerH);

      ctx.fillStyle = "#666";
      for (const obs of s.obstacles) {
        ctx.fillRect(obs.x, GROUND - obs.h + 30, obs.w, obs.h);
      }

      ctx.fillStyle = "#fff";
      ctx.font = "12px monospace";
      ctx.fillText(`SCORE: ${Math.floor(s.frame / 6)}`, 8, 16);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, onGameOver]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [jump]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="border-2 border-[#ff6b9d]/40 rounded w-full max-w-[320px]"
        style={{ imageRendering: "pixelated" }}
        onClick={jump}
      />
      {gameOver && (
        <p className="text-lg font-bold text-[#ff6b9d]">GAME OVER — SCORE: {score}</p>
      )}
      <Button size="sm" variant="secondary" onClick={jump} className="md:hidden">
        ジャンプ
      </Button>
      <p className="text-[10px] text-[#8888a8]">Space/タップでジャンプ</p>
    </div>
  );
}
