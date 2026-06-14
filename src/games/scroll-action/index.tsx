"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useFillCanvas } from "@/hooks/useFillCanvas";

const W = 640;
const H = 360;
const GROUND = H - 40;

interface ScrollActionGameProps {
  onGameOver: (score: number) => void;
}

export function ScrollActionGame({ onGameOver }: ScrollActionGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { containerRef, displaySize } = useFillCanvas(W, H);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({
    playerY: GROUND,
    vy: 0,
    jumping: false,
    obstacles: [] as { x: number; w: number; h: number }[],
    coins: [] as { x: number; y: number; taken: boolean }[],
    frame: 0,
    speed: 4,
    scroll: 0,
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s.jumping && s.playerY >= GROUND) {
      s.vy = -11;
      s.jumping = true;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const drawBackground = (scroll: number) => {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0a1830");
      grad.addColorStop(0.5, "#1a2848");
      grad.addColorStop(1, "#2a1840");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 12; i++) {
        const bx = ((i * 80 - scroll * 0.3) % (W + 80)) - 40;
        ctx.fillStyle = i % 2 === 0 ? "#1e3050" : "#162840";
        ctx.fillRect(bx, 60, 60, 120);
        ctx.fillStyle = "#00d4ff";
        ctx.globalAlpha = 0.15;
        ctx.fillRect(bx + 10, 80, 8, 40);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#3d2b1f";
      ctx.fillRect(0, GROUND + 40, W, H - GROUND - 40);
      for (let i = 0; i < W + 32; i += 32) {
        const tx = ((i - scroll) % (W + 32));
        ctx.fillStyle = tx % 64 === 0 ? "#4a3828" : "#3a2818";
        ctx.fillRect(tx, GROUND + 40, 32, 40);
      }

      ctx.strokeStyle = "#68c848";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + 40);
      ctx.lineTo(W, GROUND + 40);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const drawPlayer = (x: number, y: number) => {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(x + 14, GROUND + 44, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ff6b9d";
      ctx.fillRect(x, y, 28, 32);
      ctx.fillStyle = "#ffc0d8";
      ctx.fillRect(x + 4, y - 10, 20, 12);
      ctx.fillStyle = "#f5e8d8";
      ctx.fillRect(x + 8, y - 6, 6, 6);
      ctx.fillStyle = "#509030";
      ctx.fillRect(x + 4, y + 28, 10, 12);
      ctx.fillRect(x + 14, y + 28, 10, 12);
    };

    const loop = () => {
      const s = stateRef.current;
      if (gameOver) return;

      s.frame++;
      s.scroll += s.speed;
      if (s.frame % 50 === 0) {
        s.speed = Math.min(10, s.speed + 0.15);
        setScore(Math.floor(s.frame / 5));
      }

      s.vy += 0.55;
      s.playerY += s.vy;
      if (s.playerY >= GROUND) {
        s.playerY = GROUND;
        s.vy = 0;
        s.jumping = false;
      }

      if (s.frame % Math.max(35, 70 - s.speed * 4) === 0) {
        s.obstacles.push({
          x: W + 20,
          w: 18 + Math.random() * 24,
          h: 24 + Math.random() * 30,
        });
      }
      if (s.frame % 90 === 0) {
        s.coins.push({ x: W + 20, y: GROUND - 20 - Math.random() * 50, taken: false });
      }

      const playerX = 80;
      const playerH = 32;
      const playerW = 28;

      for (const obs of s.obstacles) obs.x -= s.speed;
      s.obstacles = s.obstacles.filter((o) => o.x > -60);

      for (const coin of s.coins) coin.x -= s.speed;
      s.coins = s.coins.filter((c) => c.x > -20 && !c.taken);

      for (const obs of s.obstacles) {
        const obsY = GROUND + 40 - obs.h;
        if (
          playerX + playerW > obs.x &&
          playerX < obs.x + obs.w &&
          s.playerY + playerH > obsY &&
          s.playerY < obsY + obs.h
        ) {
          setGameOver(true);
          onGameOver(Math.floor(s.frame / 5));
          return;
        }
      }

      for (const coin of s.coins) {
        if (coin.taken) continue;
        if (Math.abs(coin.x - playerX) < 24 && Math.abs(coin.y - s.playerY) < 30) {
          coin.taken = true;
        }
      }

      drawBackground(s.scroll);
      drawPlayer(playerX, s.playerY);

      for (const coin of s.coins) {
        if (coin.taken) continue;
        ctx.fillStyle = "#f0c040";
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#886010";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = "#666";
      for (const obs of s.obstacles) {
        const obsY = GROUND + 40 - obs.h;
        ctx.fillStyle = "#5090a0";
        ctx.fillRect(obs.x, obsY, obs.w, obs.h);
        ctx.fillStyle = "#4080d0";
        ctx.fillRect(obs.x + 2, obsY + 2, obs.w - 4, 6);
      }

      ctx.font = "bold 14px monospace";
      ctx.fillStyle = "#68c848";
      ctx.strokeStyle = "#201820";
      ctx.lineWidth = 3;
      ctx.strokeText(`SCORE ${Math.floor(s.frame / 5)}`, 12, 24);
      ctx.fillText(`SCORE ${Math.floor(s.frame / 5)}`, 12, 24);

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
    <div ref={containerRef} className="absolute inset-0 flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: displaySize.w, height: displaySize.h, imageRendering: "pixelated" }}
        onClick={jump}
      />
      {gameOver && (
        <p
          className="absolute bottom-16 text-xl font-bold text-[#68c848]"
          style={{ textShadow: "2px 2px 0 #201820" }}
        >
          GAME OVER — SCORE: {score}
        </p>
      )}
      <Button size="sm" variant="secondary" onClick={jump} className="absolute bottom-3 md:hidden">
        ジャンプ
      </Button>
    </div>
  );
}
