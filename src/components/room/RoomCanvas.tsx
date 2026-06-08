"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GRID_HEIGHT,
  GRID_WIDTH,
  type Direction,
  type RoomLayout,
} from "@/types/room";
import type { AvatarConfig } from "@/types/avatar";
import type { RoomPlayer, RoomStamp } from "@/types/presence";
import { isNearPC, resolvePCPosition } from "@/lib/roomPc";
import {
  canvasSize,
  depthKey,
  drawIsoBlock,
  drawIsoCharacter,
  drawIsoFloorTile,
  drawIsoWall,
  drawNameTag,
  drawPlatformBase,
  gridToScreen,
  screenToGrid,
  ISO_BLOCK_H,
  ISO_WALL_LAYERS,
} from "@/lib/isometric";

interface ItemInfo {
  id: string;
  spriteKey: string;
  name: string;
  category: string;
}

interface RoomCanvasProps {
  layout: RoomLayout;
  items: ItemInfo[];
  avatarConfig: AvatarConfig;
  displayName?: string;
  titleName?: string;
  isAdmin?: boolean;
  wallpaperId?: string;
  floorId?: string;
  isEditing?: boolean;
  readOnly?: boolean;
  controlledPos?: { gridX: number; gridY: number };
  controlledDirection?: Direction;
  remotePlayers?: RoomPlayer[];
  stamps?: RoomStamp[];
  onInteractPC?: () => void;
  onNearPCChange?: (near: boolean) => void;
  onMove?: (x: number, y: number) => void;
  onPlayerMove?: (x: number, y: number, dir: Direction) => void;
}

const FURNITURE: Record<string, { color: string; layers: number }> = {
  furniture_pc_01: { color: "#4a5568", layers: 2 },
  furniture_desk_01: { color: "#8b6914", layers: 1 },
  furniture_chair_01: { color: "#c0392b", layers: 1 },
  furniture_plant_01: { color: "#27ae60", layers: 2 },
};

const WALLPAPER: Record<string, string> = {
  wall_default: "#6b5b95",
  wall_blue: "#4a7ab5",
  wall_pink: "#b56b8a",
};

const FLOOR: Record<string, string> = {
  floor_default: "#5c4033",
  floor_wood: "#8b6914",
  floor_tile: "#6a6a7a",
};

function getOccupiedCells(layout: RoomLayout): Set<string> {
  const cells = new Set<string>();
  for (const f of layout) cells.add(`${f.gridX},${f.gridY}`);
  return cells;
}

function isWallCell(x: number, y: number): boolean {
  return x === 0 || y === 0 || x === GRID_WIDTH - 1 || y === GRID_HEIGHT - 1;
}

export function RoomCanvas({
  layout,
  items,
  displayName = "プレイヤー",
  titleName,
  isAdmin = false,
  wallpaperId = "wall_default",
  floorId = "floor_default",
  isEditing = false,
  readOnly = false,
  controlledPos,
  controlledDirection,
  remotePlayers = [],
  stamps = [],
  onInteractPC,
  onNearPCChange,
  onMove,
  onPlayerMove,
}: RoomCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalPos, setInternalPos] = useState({ gridX: 8, gridY: 8 });
  const [internalDir, setInternalDir] = useState<Direction>("down");
  const [hoverCell, setHoverCell] = useState<{ gridX: number; gridY: number } | null>(null);
  const playerPos = controlledPos ?? internalPos;
  const direction = controlledDirection ?? internalDir;
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const { width: CW, height: CH } = canvasSize(GRID_WIDTH, GRID_HEIGHT);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CW, CH);
    ctx.imageSmoothingEnabled = false;

    const bg = ctx.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0, "#1a1030");
    bg.addColorStop(0.5, "#2d1b4e");
    bg.addColorStop(1, "#0a0a14");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    const floorColor = FLOOR[floorId] ?? "#5c4033";
    const wallColor = WALLPAPER[wallpaperId] ?? "#6b5b95";
    const baseColor = "#3d2b4f";

    drawPlatformBase(ctx, GRID_WIDTH, GRID_HEIGHT, baseColor);

    const floorCells: { x: number; y: number; key: number }[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (!isWallCell(x, y)) {
          floorCells.push({ x, y, key: depthKey(x, y) });
        }
      }
    }
    floorCells.sort((a, b) => a.key - b.key);

    for (const { x, y } of floorCells) {
      const { x: sx, y: sy } = gridToScreen(x, y, GRID_WIDTH, GRID_HEIGHT);
      const isHighlight =
        isEditing &&
        hoverCell?.gridX === x &&
        hoverCell?.gridY === y;
      const isPlayer = playerPos.gridX === x && playerPos.gridY === y;
      drawIsoFloorTile(
        ctx,
        sx,
        sy,
        floorColor,
        isHighlight || isPlayer,
      );
    }

    const wallCells: { x: number; y: number; key: number; layers: number }[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (isWallCell(x, y)) {
          wallCells.push({ x, y, key: depthKey(x, y), layers: ISO_WALL_LAYERS });
        }
      }
    }
    wallCells.sort((a, b) => a.key - b.key);
    for (const { x, y, layers } of wallCells) {
      const { x: sx, y: sy } = gridToScreen(x, y, GRID_WIDTH, GRID_HEIGHT);
      drawIsoWall(ctx, sx, sy, wallColor, layers);
    }

    const furniture = [...layout].sort(
      (a, b) => depthKey(a.gridX, a.gridY, a.zIndex) - depthKey(b.gridX, b.gridY, b.zIndex),
    );
    for (const placed of furniture) {
      const item = itemMap.get(placed.itemId);
      if (!item) continue;
      const def = FURNITURE[item.spriteKey] ?? { color: "#666", layers: 1 };
      const { x: sx, y: sy } = gridToScreen(placed.gridX, placed.gridY, GRID_WIDTH, GRID_HEIGHT);
      drawIsoBlock(ctx, sx, sy, def.color, def.layers);

      if (item.spriteKey === "furniture_pc_01") {
        ctx.fillStyle = "#7ec8ff";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "center";
        ctx.fillText("PC", sx, sy - def.layers * ISO_BLOCK_H - 2);
      }
    }

    const drawPlayer = (
      gx: number,
      gy: number,
      name: string,
      body: string,
      shirt: string,
      title?: string,
      admin?: boolean,
    ) => {
      const { x: sx, y: sy } = gridToScreen(gx, gy, GRID_WIDTH, GRID_HEIGHT);
      drawIsoCharacter(ctx, sx, sy, body, shirt);
      drawNameTag(ctx, sx, sy, name, title, admin);
    };

    for (const rp of remotePlayers) {
      const shared = !!rp.previewConfig;
      drawPlayer(
        rp.gridX,
        rp.gridY,
        rp.displayName,
        "#b4e4ff",
        shared ? "#f5a623" : "#4a90d9",
        rp.titleName,
        rp.isAdmin,
      );
    }

    for (const stamp of stamps) {
      const { x: sx, y: sy } = gridToScreen(stamp.gridX, stamp.gridY, GRID_WIDTH, GRID_HEIGHT);
      ctx.fillStyle = "#e94560";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("♥", sx, sy - ISO_BLOCK_H * 2);
    }

    drawPlayer(
      playerPos.gridX,
      playerPos.gridY,
      displayName,
      "#ffcba4",
      "#e94560",
      titleName,
      isAdmin,
    );

    const { x: px, y: py } = gridToScreen(playerPos.gridX, playerPos.gridY, GRID_WIDTH, GRID_HEIGHT);
    const arrow = { up: "▲", down: "▼", left: "◀", right: "▶" }[direction];
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(arrow, px, py - ISO_BLOCK_H * 3.8);
  }, [
    CW,
    CH,
    layout,
    itemMap,
    wallpaperId,
    floorId,
    playerPos,
    direction,
    displayName,
    titleName,
    isAdmin,
    remotePlayers,
    stamps,
    isEditing,
    hoverCell,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (isEditing) {
      onNearPCChange?.(false);
      return;
    }
    const spriteMap = new Map(items.map((i) => [i.id, i.spriteKey]));
    const pcPos = resolvePCPosition(layout, spriteMap);
    onNearPCChange?.(isNearPC(playerPos, pcPos));
  }, [isEditing, items, layout, playerPos, onNearPCChange]);

  const movePlayer = useCallback(
    (dir: Direction) => {
      const delta: Record<Direction, [number, number]> = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0],
      };
      const [dx, dy] = delta[dir];
      const prev = playerPos;
      const newX = Math.max(1, Math.min(GRID_WIDTH - 2, prev.gridX + dx));
      const newY = Math.max(1, Math.min(GRID_HEIGHT - 2, prev.gridY + dy));
      if (getOccupiedCells(layout).has(`${newX},${newY}`)) return;

      if (controlledPos) {
        onPlayerMove?.(newX, newY, dir);
      } else {
        setInternalDir(dir);
        setInternalPos({ gridX: newX, gridY: newY });
        onMove?.(newX, newY);
      }
    },
    [layout, onMove, onPlayerMove, controlledPos, playerPos],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isEditing) return;
      const keyMap: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        movePlayer(dir);
      }
      if (e.key === " " || e.key === "Enter") {
        if (readOnly) return;
        const pc = layout.find((f) => {
          const item = itemMap.get(f.itemId);
          return item?.spriteKey === "furniture_pc_01";
        });
        if (pc) {
          const dist =
            Math.abs(playerPos.gridX - pc.gridX) + Math.abs(playerPos.gridY - pc.gridY);
          if (dist <= 1) onInteractPC?.();
        }
      }
    },
    [isEditing, readOnly, movePlayer, layout, itemMap, playerPos, onInteractPC],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const canvasToGrid = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (clientX - rect.left) * scaleX;
    const sy = (clientY - rect.top) * scaleY;
    return screenToGrid(sx, sy, GRID_WIDTH, GRID_HEIGHT);
  };

  const handlePointer = (clientX: number, clientY: number) => {
    const cell = canvasToGrid(clientX, clientY);
    if (!cell || isWallCell(cell.gridX, cell.gridY)) return;

    if (isEditing) {
      setHoverCell(cell);
      onMove?.(cell.gridX, cell.gridY);
      return;
    }

    const dx = cell.gridX - playerPos.gridX;
    const dy = cell.gridY - playerPos.gridY;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    if (dx > 0) movePlayer("right");
    else if (dx < 0) movePlayer("left");
    else if (dy > 0) movePlayer("down");
    else movePlayer("up");
  };

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-[#e94560]/30 shadow-lg shadow-[#e94560]/10">
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="w-full cursor-pointer"
        style={{ imageRendering: "pixelated", maxWidth: "100%" }}
        onClick={(e) => handlePointer(e.clientX, e.clientY)}
        onMouseMove={(e) => {
          if (!isEditing) return;
          const cell = canvasToGrid(e.clientX, e.clientY);
          if (cell && !isWallCell(cell.gridX, cell.gridY)) {
            setHoverCell(cell);
            onMove?.(cell.gridX, cell.gridY);
          }
        }}
      />
      {!isEditing && (
        <div className="absolute bottom-2 right-2 flex gap-1 md:hidden">
          {(["up", "left", "down", "right"] as Direction[]).map((dir) => (
            <button
              key={dir}
              onClick={() => movePlayer(dir)}
              className="w-10 h-10 bg-[#1a1a2e]/90 text-white rounded border border-[#e94560]/30 text-sm backdrop-blur"
            >
              {{ up: "↑", down: "↓", left: "←", right: "→" }[dir]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
