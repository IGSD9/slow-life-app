"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useFillCanvas } from "@/hooks/useFillCanvas";

const W = 640;
const H = 360;
const GROUND = H - 48;
const FLOOR_H = 48;

interface Fighter {
  x: number;
  displayX: number;
  hp: number;
  facing: 1 | -1;
  attacking: boolean;
  attackTimer: number;
  hitFlash: number;
  color: string;
  accent: string;
  label: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface FightingGameProps {
  onGameOver: (score: number) => void;
}

function drawBrickStage(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#1a0a28");
  grad.addColorStop(0.45, "#2d1040");
  grad.addColorStop(1, "#0a0814");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 14; col++) {
      const bx = col * 48 + (row % 2) * 24 - 12;
      const by = 40 + row * 22;
      const tone = (row + col) % 3;
      ctx.fillStyle = ["#4a2838", "#5a3040", "#3a2030"][tone];
      ctx.fillRect(bx, by, 46, 20);
      ctx.strokeStyle = "#2a1828";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 46, 20);
    }
  }

  ctx.fillStyle = "#1a1020";
  ctx.fillRect(0, GROUND, W, FLOOR_H);
  for (let i = 0; i < W; i += 32) {
    ctx.fillStyle = i % 64 === 0 ? "#251830" : "#1e1428";
    ctx.fillRect(i, GROUND, 32, FLOOR_H);
  }

  ctx.strokeStyle = "#ff6b9d";
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(0, GROUND);
  ctx.lineTo(W, GROUND);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#00d4ff";
  ctx.globalAlpha = 0.08;
  ctx.fillRect(0, 0, W, GROUND);
  ctx.globalAlpha = 1;
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  hp: number,
  color: string,
  label: string,
  align: "left" | "right",
) {
  const barW = 180;
  const barH = 14;
  const bx = align === "left" ? x : x - barW;

  ctx.fillStyle = "#201820";
  ctx.fillRect(bx - 2, y - 2, barW + 4, barH + 4);
  ctx.strokeStyle = "#886040";
  ctx.lineWidth = 2;
  ctx.strokeRect(bx - 2, y - 2, barW + 4, barH + 4);

  ctx.fillStyle = "#302830";
  ctx.fillRect(bx, y, barW, barH);

  const fillW = Math.max(0, (hp / 100) * barW);
  const grad = ctx.createLinearGradient(bx, y, bx + barW, y);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "#ffffff88");
  ctx.fillStyle = grad;
  if (align === "left") ctx.fillRect(bx, y, fillW, barH);
  else ctx.fillRect(bx + barW - fillW, y, fillW, barH);

  ctx.font = "bold 11px monospace";
  ctx.textAlign = align === "left" ? "left" : "right";
  ctx.fillStyle = "#e8f0e0";
  ctx.strokeStyle = "#201820";
  ctx.lineWidth = 3;
  ctx.strokeText(label, bx, y - 6);
  ctx.fillText(label, bx, y - 6);
}

function drawPixelFighter(ctx: CanvasRenderingContext2D, f: Fighter, shake: number) {
  const x = f.displayX + shake;
  const footY = GROUND;
  const bodyW = 36;
  const bodyH = 52;
  const bodyX = x - bodyW / 2;
  const bodyY = footY - bodyH;

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x, footY + 4, bodyW * 0.55, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (f.hitFlash > 0) {
    ctx.globalAlpha = 0.5 + Math.sin(f.hitFlash * 0.8) * 0.3;
  }

  ctx.fillStyle = f.color;
  ctx.fillRect(bodyX, bodyY + 16, bodyW, bodyH - 16);
  ctx.fillStyle = f.accent;
  ctx.fillRect(bodyX + 4, bodyY, bodyW - 8, 18);
  ctx.fillStyle = "#f5e8d8";
  ctx.fillRect(bodyX + 10, bodyY + 4, 8, 8);
  ctx.fillRect(bodyX + bodyW - 18, bodyY + 4, 8, 8);

  ctx.fillStyle = shade(f.color, -20);
  const legW = 12;
  ctx.fillRect(bodyX + 4, footY - 16, legW, 16);
  ctx.fillRect(bodyX + bodyW - legW - 4, footY - 16, legW, 16);

  if (f.facing === 1) {
    ctx.fillStyle = f.accent;
    ctx.fillRect(bodyX + bodyW - 6, bodyY + 22, 8, 20);
  } else {
    ctx.fillStyle = f.accent;
    ctx.fillRect(bodyX - 2, bodyY + 22, 8, 20);
  }

  if (f.attacking && f.attackTimer > 5) {
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.9;
    const ax = f.facing === 1 ? bodyX + bodyW : bodyX - 28;
    ctx.fillRect(ax, bodyY + 24, 28, 12);
    ctx.fillStyle = "#ff6b9d";
    ctx.fillRect(ax + (f.facing === 1 ? 20 : 0), bodyY + 26, 12, 8);
    ctx.globalAlpha = 1;
  }

  ctx.globalAlpha = 1;
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function FightingGame({ onGameOver }: FightingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { containerRef, displaySize } = useFillCanvas(W, H);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<"player" | "cpu" | null>(null);
  const stateRef = useRef({
    player: {
      x: 140,
      displayX: 140,
      hp: 100,
      facing: 1 as 1 | -1,
      attacking: false,
      attackTimer: 0,
      hitFlash: 0,
      color: "#ff6b9d",
      accent: "#ffc0d8",
      label: "YOU",
    },
    cpu: {
      x: 500,
      displayX: 500,
      hp: 100,
      facing: -1 as 1 | -1,
      attacking: false,
      attackTimer: 0,
      hitFlash: 0,
      color: "#4a90d9",
      accent: "#90c8ff",
      label: "CPU",
    },
    frame: 0,
    shake: 0,
    particles: [] as Particle[],
  });

  const attack = useCallback((who: "player" | "cpu") => {
    const f = stateRef.current[who];
    if (f.attacking) return;
    f.attacking = true;
    f.attackTimer = 18;
  }, []);

  const move = useCallback((who: "player" | "cpu", dx: number) => {
    const f = stateRef.current[who];
    f.x = Math.max(60, Math.min(W - 60, f.x + dx));
    f.facing = dx >= 0 ? 1 : -1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const hitCheck = (attacker: Fighter, defender: Fighter) => {
      const range = 70;
      const dist = Math.abs(attacker.x - defender.x);
      const facingTarget =
        (attacker.facing === 1 && defender.x > attacker.x) ||
        (attacker.facing === -1 && defender.x < attacker.x);
      return dist < range && facingTarget;
    };

    const spawnHitFx = (x: number, y: number, color: string) => {
      const s = stateRef.current;
      for (let i = 0; i < 8; i++) {
        s.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 2,
          life: 20 + Math.random() * 10,
          color,
          size: 3 + Math.random() * 4,
        });
      }
      s.shake = 6;
    };

    const loop = () => {
      if (gameOver) return;
      const s = stateRef.current;
      s.frame++;

      if (s.frame % 80 === 0) {
        const roll = Math.random();
        if (roll < 0.35) attack("cpu");
        else move("cpu", s.player.x < s.cpu.x ? -5 : 5);
      } else if (s.frame % 25 === 0) {
        move("cpu", s.player.x < s.cpu.x ? -4 : 4);
      }

      for (const key of ["player", "cpu"] as const) {
        const f = s[key];
        f.displayX += (f.x - f.displayX) * 0.35;
        if (f.hitFlash > 0) f.hitFlash--;
        if (f.attacking) {
          f.attackTimer--;
          if (f.attackTimer <= 0) f.attacking = false;
          else if (f.attackTimer === 10) {
            const other = key === "player" ? s.cpu : s.player;
            if (hitCheck(f, other)) {
              other.hp -= 10;
              other.hitFlash = 12;
              spawnHitFx(other.x, GROUND - 40, key === "player" ? "#ff6b9d" : "#4a90d9");
            }
          }
        }
      }

      s.shake *= 0.75;
      s.particles = s.particles
        .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, life: p.life - 1 }))
        .filter((p) => p.life > 0);

      if (s.player.hp <= 0) {
        setGameOver(true);
        setWinner("cpu");
        onGameOver(0);
        return;
      }
      if (s.cpu.hp <= 0) {
        setGameOver(true);
        setWinner("player");
        onGameOver(100 + s.player.hp);
        return;
      }

      const shakeX = Math.round((Math.random() - 0.5) * s.shake * 2);

      ctx.save();
      ctx.translate(shakeX, 0);
      drawBrickStage(ctx);

      drawHpBar(ctx, 16, 16, W, s.player.hp, "#ff6b9d", "YOU", "left");
      drawHpBar(ctx, W - 16, 16, W, s.cpu.hp, "#4a90d9", "CPU", "right");

      drawPixelFighter(ctx, s.cpu, 0);
      drawPixelFighter(ctx, s.player, 0);

      for (const p of s.particles) {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "#9494b0";
      ctx.textAlign = "center";
      ctx.fillText("A/D: 移動  F/Space: 攻撃", W / 2, H - 12);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, onGameOver, attack, move]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === "a" || e.key === "ArrowLeft") move("player", -8);
      if (e.key === "d" || e.key === "ArrowRight") move("player", 8);
      if (e.key === "f" || e.key === " ") {
        e.preventDefault();
        attack("player");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameOver, move, attack]);

  return (
    <div ref={containerRef} className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          width: displaySize.w,
          height: displaySize.h,
          imageRendering: "pixelated",
        }}
      />
      {gameOver && (
        <p
          className="absolute bottom-16 text-xl font-bold text-[#68c848] pointer-events-none"
          style={{ textShadow: "2px 2px 0 #201820, 0 0 12px #ff6b9d" }}
        >
          {winner === "player" ? "K.O. WIN!" : "K.O. LOSE..."}
        </p>
      )}
      <div className="absolute bottom-3 flex gap-2 md:hidden">
        <Button size="sm" variant="secondary" onClick={() => move("player", -8)}>←</Button>
        <Button size="sm" variant="secondary" onClick={() => attack("player")}>攻撃</Button>
        <Button size="sm" variant="secondary" onClick={() => move("player", 8)}>→</Button>
      </div>
    </div>
  );
}
