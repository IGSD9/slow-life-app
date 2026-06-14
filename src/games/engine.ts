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
    name: "テトリス・ネオンエディション",
    expMultiplier: 0.1,
    route: "/games/tetris",
  },
  solitaire: {
    gameId: "solitaire",
    name: "ソリティア・カジノロイヤル",
    expMultiplier: 0.1,
    route: "/games/solitaire",
  },
  scroll_action: {
    gameId: "scroll_action",
    name: "横スクロール・ドットランナー",
    expMultiplier: 0.1,
    route: "/games/scroll-action",
  },
  fighting: {
    gameId: "fighting",
    name: "ドット・スマッシュ・コロシアム",
    expMultiplier: 0.1,
    route: "/games/fighting",
  },
  real_fps: {
    gameId: "real_fps",
    name: "超リアル3D：ネオンFPS",
    expMultiplier: 0.5,
    route: "/games/real-fps",
  },
};

/** PCデスクトップ表示順（5大ガチタイトル） */
export const GAME_MENU_ORDER = [
  "tetris",
  "solitaire",
  "scroll_action",
  "fighting",
  "real_fps",
] as const;

export function calcExpFromScore(score: number, gameId: string): number {
  const cfg = GAME_REGISTRY[gameId];
  return Math.ceil(score * (cfg?.expMultiplier ?? 0.1));
}
