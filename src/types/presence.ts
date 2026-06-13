import type { AvatarConfig } from "./avatar";
import type { Direction } from "./room";

export interface PresencePayload {
  userId: string;
  displayName: string;
  gridX: number;
  gridY: number;
  avatarConfig: AvatarConfig;
  direction: Direction;
  titleName?: string;
  isAdmin?: boolean;
}

export interface RoomPlayer extends PresencePayload {
  isSelf?: boolean;
  /** 試着共有で一時的に上書きされたコーデ */
  previewConfig?: AvatarConfig;
  /** クローゼット試着（部屋内のみ） */
  tryOnConfig?: AvatarConfig;
}

export interface OutfitShareEvent {
  type: "outfit_share";
  fromUserId: string;
  config: AvatarConfig;
}

export interface StampEvent {
  type: "stamp";
  fromUserId: string;
  stampId: string;
  gridX: number;
  gridY: number;
}

export interface TradeRequestEvent {
  type: "trade_request";
  sessionId: string;
  fromUserId: string;
}

export interface ClosetTryOnEvent {
  type: "closet_tryon";
  fromUserId: string;
  targetUserId: string;
  config: AvatarConfig;
}

export interface FurnitureMoveEvent {
  type: "furniture_move";
  fromUserId: string;
  itemId: string;
  gridX: number;
  gridY: number;
  rotation?: number;
}

export type RoomBroadcastEvent =
  | OutfitShareEvent
  | StampEvent
  | TradeRequestEvent
  | ClosetTryOnEvent
  | FurnitureMoveEvent;

export interface RoomStamp {
  id: string;
  stampId: string;
  gridX: number;
  gridY: number;
  fromUserId: string;
}
