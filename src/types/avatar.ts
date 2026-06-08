export interface AvatarConfig {
  hat?: string;
  top?: string;
  bottom?: string;
  shoes?: string;
  accessory?: string;
}

export const AVATAR_LAYERS = [
  "bottom",
  "top",
  "shoes",
  "hat",
  "accessory",
] as const;
