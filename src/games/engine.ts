/** ミニゲーム共通インターフェース（詳細設計書 §7.1） */

export interface MiniGameConfig {
  gameId: string;
  name: string;
  expMultiplier: number;
  route: string;
}

export interface MiniGameResult {
  score: number;
  duration?: number;
}

export interface MiniGameProps {
  onGameOver: (score: number) => void;
}

export const GAME_REGISTRY: Record<string, MiniGameConfig> = {
  tetris: {
    gameId: "tetris",
    name: "テトリス",
    expMultiplier: 0.1,
    route: "/games/tetris",
  },
  solitaire: {
    gameId: "solitaire",
    name: "ソリティア",
    expMultiplier: 0.1,
    route: "/games/solitaire",
  },
  scroll_action: {
    gameId: "scroll_action",
    name: "横スクロールアクション",
    expMultiplier: 0.1,
    route: "/games/scroll-action",
  },
  fighting: {
    gameId: "fighting",
    name: "大乱闘",
    expMultiplier: 0.1,
    route: "/games/fighting",
  },
  real_fps: {
    gameId: "real_fps",
    name: "ネオンFPS",
    expMultiplier: 0.5,
    route: "/games/real-fps",
  },
  dungeon_village: {
    gameId: "dungeon_village",
    name: "冒険ダンジョン村",
    expMultiplier: 0.15,
    route: "/games/dungeon-village",
  },
};

export function calcExpFromScore(score: number, gameId: string): number {
  const cfg = GAME_REGISTRY[gameId];
  return Math.ceil(score * (cfg?.expMultiplier ?? 0.1));
}
