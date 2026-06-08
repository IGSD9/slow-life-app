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
  DECK_BOUNDS,
  drawDeckRiser,
  drawIsoBlock,
  drawIsoCharacter,
  drawIsoFloorTile,
  drawIsoPatternWall,
  drawNameTag,
  drawPlatformBase,
  drawRoomBoundsOutline,
  drawSkyBackground,
  floorElevation,
  gridToScreen,
  isDeckCell,
  screenToGrid,
  ISO_BLOCK_H,
  ISO_WALL_LAYERS,
  shade,
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
  wall_default: "#e8a8c8",
  wall_blue: "#8ab4d9",
  wall_pink: "#f0b0d0",
};

const FLOOR: Record<string, string> = {
  floor_default: "#c49a6c",
  floor_wood: "#b8895a",
  floor_tile: "#9a9aaa",
};

const DECK_FLOOR: Record<string, string> = {
  floor_default: "#d4aa78",
  floor_wood: "#c99760",
  floor_tile: "#b0b0c0",
};

function getOccupiedCells(layout: RoomLayout): Set<string> {
  const cells = new Set<string>();
  for (const f of layout) cells.add(`${f.gridX},${f.gridY}`);
  return cells;
}

/** 3面壁（正面は開放してダイオラマ風に） */
function isWallCell(x: number, y: number): boolean {
  return x === 0 || y === 0 || x === GRID_WIDTH - 1;
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

    drawSkyBackground(ctx, CW, CH);

    const floorColor = FLOOR[floorId] ?? "#c49a6c";
    const deckColor = DECK_FLOOR[floorId] ?? "#d4aa78";
    const wallColor = WALLPAPER[wallpaperId] ?? "#e8a8c8";
    const baseColor = "#8a9aaa";
    const usePlank = floorId !== "floor_tile";

    drawPlatformBase(ctx, GRID_WIDTH, GRID_HEIGHT, baseColor);

    const floorCells: { x: number; y: number; key: number; z: number }[] = [];
    for (let y = 1; y < GRID_HEIGHT; y++) {
      for (let x = 1; x < GRID_WIDTH - 1; x++) {
        const z = floorElevation(x, y);
        floorCells.push({ x, y, key: depthKey(x, y, z), z });
      }
    }
    floorCells.sort((a, b) => a.key - b.key);

    const riserCells: { x: number; y: number; key: number }[] = [];
    for (let y = DECK_BOUNDS.minY; y <= DECK_BOUNDS.maxY; y++) {
      for (let x = DECK_BOUNDS.minX; x <= DECK_BOUNDS.maxX; x++) {
        const adj: [number, number][] = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
        for (const [nx, ny] of adj) {
          if (isDeckCell(x, y) && !isDeckCell(nx, ny) && !isWallCell(nx, ny)) {
            if (nx >= 1 && nx < GRID_WIDTH - 1 && ny >= 1 && ny < GRID_HEIGHT) {
              riserCells.push({ x: nx, y: ny, key: depthKey(nx, ny) });
            }
          }
        }
      }
    }
    const seenRisers = new Set<string>();
    for (const { x, y, key } of riserCells) {
      const k = `${x},${y}`;
      if (seenRisers.has(k)) continue;
      seenRisers.add(k);
      const { x: sx, y: sy } = gridToScreen(x, y, GRID_WIDTH, GRID_HEIGHT, 0);
      drawDeckRiser(ctx, sx, sy, shade(floorColor, -18));
    }

    for (const { x, y, z } of floorCells) {
      const { x: sx, y: sy } = gridToScreen(x, y, GRID_WIDTH, GRID_HEIGHT, z);
      const isHighlight =
        isEditing && hoverCell?.gridX === x && hoverCell?.gridY === y;
      const isPlayer = playerPos.gridX === x && playerPos.gridY === y;
      const onDeck = z > 0;
      drawIsoFloorTile(
        ctx,
        sx,
        sy,
        onDeck ? deckColor : floorColor,
        isHighlight || isPlayer,
        usePlank,
      );
    }

    const wallCells: { x: number; y: number; key: number; layers: number; window: boolean }[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (isWallCell(x, y)) {
          const isBack = y === 0 && x > 0 && x < GRID_WIDTH - 1;
          wallCells.push({
            x,
            y,
            key: depthKey(x, y),
            layers: ISO_WALL_LAYERS,
            window: isBack && x % 3 === 1,
          });
        }
      }
    }
    wallCells.sort((a, b) => a.key - b.key);
    for (const { x, y, layers, window } of wallCells) {
      const { x: sx, y: sy } = gridToScreen(x, y, GRID_WIDTH, GRID_HEIGHT, 0);
      drawIsoPatternWall(ctx, sx, sy, wallColor, layers, window);
    }

    if (isEditing) {
      drawRoomBoundsOutline(ctx, GRID_WIDTH, GRID_HEIGHT);
    }

    const furniture = [...layout].sort(
      (a, b) => depthKey(a.gridX, a.gridY, a.zIndex) - depthKey(b.gridX, b.gridY, b.zIndex),
    );
    for (const placed of furniture) {
      const item = itemMap.get(placed.itemId);
      if (!item) continue;
      const def = FURNITURE[item.spriteKey] ?? { color: "#666", layers: 1 };
      const z = floorElevation(placed.gridX, placed.gridY);
      const { x: sx, y: sy } = gridToScreen(placed.gridX, placed.gridY, GRID_WIDTH, GRID_HEIGHT, z);
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
      const z = floorElevation(gx, gy);
      const { x: sx, y: sy } = gridToScreen(gx, gy, GRID_WIDTH, GRID_HEIGHT, z);
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
      const z = floorElevation(stamp.gridX, stamp.gridY);
      const { x: sx, y: sy } = gridToScreen(stamp.gridX, stamp.gridY, GRID_WIDTH, GRID_HEIGHT, z);
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

    const pz = floorElevation(playerPos.gridX, playerPos.gridY);
    const { x: px, y: py } = gridToScreen(playerPos.gridX, playerPos.gridY, GRID_WIDTH, GRID_HEIGHT, pz);
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
      const newY = Math.max(1, Math.min(GRID_HEIGHT - 1, prev.gridY + dy));
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
    <div className="relative overflow-hidden rounded-xl border-2 border-[#7ec8e8]/50 shadow-lg shadow-[#7ec8e8]/20">
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
