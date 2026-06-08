"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

const W = 320;
const H = 200;

interface Fighter {
  x: number;
  hp: number;
  facing: 1 | -1;
  attacking: boolean;
  attackTimer: number;
}

interface FightingGameProps {
  onGameOver: (score: number) => void;
}

export function FightingGame({ onGameOver }: FightingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<"player" | "cpu" | null>(null);
  const stateRef = useRef({
    player: { x: 60, hp: 100, facing: 1 as 1 | -1, attacking: false, attackTimer: 0 },
    cpu: { x: 240, hp: 100, facing: -1 as 1 | -1, attacking: false, attackTimer: 0 },
    frame: 0,
  });

  const attack = useCallback((who: "player" | "cpu") => {
    const s = stateRef.current;
    const fighter = s[who];
    if (fighter.attacking) return;
    fighter.attacking = true;
    fighter.attackTimer = 15;
  }, []);

  const move = useCallback((who: "player" | "cpu", dx: number) => {
    const s = stateRef.current;
    const fighter = s[who];
    fighter.x = Math.max(20, Math.min(W - 40, fighter.x + dx));
    fighter.facing = dx >= 0 ? 1 : -1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const hitCheck = (attacker: Fighter, defender: Fighter) => {
      const range = 45;
      const dist = Math.abs(attacker.x - defender.x);
      const facingTarget =
        (attacker.facing === 1 && defender.x > attacker.x) ||
        (attacker.facing === -1 && defender.x < attacker.x);
      return dist < range && facingTarget;
    };

    const loop = () => {
      if (gameOver) return;
      const s = stateRef.current;
      s.frame++;

      if (s.frame % 90 === 0) {
        const actions = ["move", "attack", "move"] as const;
        const action = actions[Math.floor(Math.random() * actions.length)];
        if (action === "move") move("cpu", (Math.random() > 0.5 ? 1 : -1) * 4);
        else attack("cpu");
      } else if (s.frame % 30 === 0) {
        move("cpu", s.player.x < s.cpu.x ? -3 : 3);
      }

      for (const key of ["player", "cpu"] as const) {
        const f = s[key];
        if (f.attacking) {
          f.attackTimer--;
          if (f.attackTimer <= 0) f.attacking = false;
          else if (f.attackTimer === 8) {
            const other = key === "player" ? s.cpu : s.player;
            if (hitCheck(f, other)) {
              other.hp -= 12;
            }
          }
        }
      }

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

      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, H - 40, W, 40);

      const drawFighter = (f: Fighter, color: string, label: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(f.x, H - 80, 30, 40);
        if (f.attacking) {
          ctx.fillStyle = "#fff";
          const ax = f.facing === 1 ? f.x + 30 : f.x - 20;
          ctx.fillRect(ax, H - 65, 20, 10);
        }
        ctx.fillStyle = "#333";
        ctx.fillRect(f.x, H - 95, 30, 6);
        ctx.fillStyle = color;
        ctx.fillRect(f.x, H - 95, (f.hp / 100) * 30, 6);
        ctx.fillStyle = "#fff";
        ctx.font = "8px monospace";
        ctx.fillText(label, f.x, H - 98);
      };

      drawFighter(s.player, "#e94560", "YOU");
      drawFighter(s.cpu, "#4a90d9", "CPU");

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, onGameOver, attack, move]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === "a") move("player", -5);
      if (e.key === "d") move("player", 5);
      if (e.key === "f" || e.key === " ") {
        e.preventDefault();
        attack("player");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameOver, move, attack]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="border-2 border-[#e94560]/40 rounded w-full max-w-[320px]"
        style={{ imageRendering: "pixelated" }}
      />
      {gameOver && (
        <p className="text-lg font-bold text-[#e94560]">
          {winner === "player" ? "勝利！" : "敗北..."}
        </p>
      )}
      <div className="flex gap-2 md:hidden">
        <Button size="sm" variant="secondary" onClick={() => move("player", -5)}>←</Button>
        <Button size="sm" variant="secondary" onClick={() => attack("player")}>攻撃</Button>
        <Button size="sm" variant="secondary" onClick={() => move("player", 5)}>→</Button>
      </div>
      <p className="text-[10px] text-gray-500">A/D: 移動 F/Space: 攻撃（CPU対戦）</p>
    </div>
  );
}
