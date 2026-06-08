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

export type RoomBroadcastEvent = OutfitShareEvent | StampEvent | TradeRequestEvent;

export interface RoomStamp {
  id: string;
  stampId: string;
  gridX: number;
  gridY: number;
  fromUserId: string;
}
