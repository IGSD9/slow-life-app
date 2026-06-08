"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

const COLS = 10;
const ROWS = 20;
const BLOCK = 24;

const SHAPES: Record<string, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

const COLORS: Record<string, string> = {
  I: "#00f0f0",
  O: "#f0f000",
  T: "#a000f0",
  S: "#00f000",
  Z: "#f00000",
  J: "#0000f0",
  L: "#f0a000",
};

type Piece = { type: string; shape: number[][]; x: number; y: number };

function randomPiece(): Piece {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  return { type, shape: SHAPES[type].map((r) => [...r]), x: 3, y: 0 };
}

function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () =>
    Array(rows).fill(0),
  );
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
}

interface TetrisGameProps {
  onGameOver: (score: number) => void;
}

export function TetrisGame({ onGameOver }: TetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<(string | null)[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
  );
  const [piece, setPiece] = useState<Piece>(randomPiece());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isValid = useCallback(
    (p: Piece, boardState: (string | null)[][]) => {
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (!p.shape[r][c]) continue;
          const nx = p.x + c;
          const ny = p.y + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
          if (ny >= 0 && boardState[ny][nx]) return false;
        }
      }
      return true;
    },
    [],
  );

  const lockPiece = useCallback(
    (p: Piece, boardState: (string | null)[][]) => {
      const newBoard = boardState.map((row) => [...row]);
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (!p.shape[r][c]) continue;
          const ny = p.y + r;
          if (ny < 0) {
            setGameOver(true);
            return { board: newBoard, lines: 0 };
          }
          newBoard[ny][p.x + c] = p.type;
        }
      }

      let lines = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (newBoard[r].every((cell) => cell !== null)) {
          newBoard.splice(r, 1);
          newBoard.unshift(Array(COLS).fill(null));
          lines++;
          r++;
        }
      }

      const lineScores = [0, 100, 300, 500, 800];
      return { board: newBoard, lines, points: lineScores[lines] ?? 0 };
    },
    [],
  );

  const tick = useCallback(() => {
    if (gameOver || paused) return;

    setBoard((prevBoard) => {
      const moved = { ...piece, y: piece.y + 1 };
      if (isValid(moved, prevBoard)) {
        setPiece(moved);
        return prevBoard;
      }

      const { board: newBoard, points } = lockPiece(piece, prevBoard);
      if (points) setScore((s) => s + points);

      const next = randomPiece();
      if (!isValid(next, newBoard)) {
        setGameOver(true);
        return newBoard;
      }
      setPiece(next);
      return newBoard;
    });
  }, [piece, gameOver, paused, isValid, lockPiece]);

  useEffect(() => {
    tickRef.current = setInterval(tick, 600);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [tick]);

  useEffect(() => {
    if (gameOver) onGameOver(score);
  }, [gameOver, score, onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board[r][c];
        if (cell) {
          ctx.fillStyle = COLORS[cell] ?? "#888";
          ctx.fillRect(c * BLOCK + 1, r * BLOCK + 1, BLOCK - 2, BLOCK - 2);
        }
      }
    }

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        ctx.fillStyle = COLORS[piece.type] ?? "#888";
        ctx.fillRect(
          (piece.x + c) * BLOCK + 1,
          (piece.y + r) * BLOCK + 1,
          BLOCK - 2,
          BLOCK - 2,
        );
      }
    }
  }, [board, piece]);

  const move = (dx: number) => {
    const moved = { ...piece, x: piece.x + dx };
    if (isValid(moved, board)) setPiece(moved);
  };

  const rotatePiece = () => {
    const rotated = { ...piece, shape: rotate(piece.shape) };
    if (isValid(rotated, board)) setPiece(rotated);
  };

  const hardDrop = () => {
    let dropped = { ...piece };
    while (isValid({ ...dropped, y: dropped.y + 1 }, board)) {
      dropped = { ...dropped, y: dropped.y + 1 };
    }
    setPiece(dropped);
    setBoard((prev) => {
      const { board: newBoard, points } = lockPiece(dropped, prev);
      if (points) setScore((s) => s + points);
      const next = randomPiece();
      if (!isValid(next, newBoard)) setGameOver(true);
      else setPiece(next);
      return newBoard;
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowDown") tick();
      if (e.key === "ArrowUp") rotatePiece();
      if (e.key === " ") {
        e.preventDefault();
        hardDrop();
      }
      if (e.key === "p") setPaused((p) => !p);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[240px]">
        <span className="text-sm font-bold text-[#ff6b9d]">SCORE: {score}</span>
        {paused && <span className="text-xs text-yellow-400">PAUSED</span>}
      </div>
      <canvas
        ref={canvasRef}
        width={COLS * BLOCK}
        height={ROWS * BLOCK}
        className="border-2 border-[#ff6b9d]/40 rounded"
        style={{ imageRendering: "pixelated" }}
      />
      {gameOver && (
        <p className="text-lg font-bold text-[#ff6b9d]">GAME OVER</p>
      )}
      <div className="flex gap-2 md:hidden">
        <Button size="sm" variant="secondary" onClick={() => move(-1)}>←</Button>
        <Button size="sm" variant="secondary" onClick={rotatePiece}>回転</Button>
        <Button size="sm" variant="secondary" onClick={() => move(1)}>→</Button>
        <Button size="sm" variant="secondary" onClick={hardDrop}>落下</Button>
      </div>
      <p className="text-[10px] text-[#8888a8]">
        PC: 矢印キー移動/回転、Space落下 / スマホ: ボタン操作
      </p>
    </div>
  );
}
