/**
 * Curated per-group color/icon options. Deliberately a small fixed palette
 * (not free-form hex) so custom group colors stay harmonic with the dark
 * luxury neumorphism theme instead of clashing with it.
 */

export const GROUP_COLORS = {
  gold: { accent: "#d8b673", strong: "#e8ca8f" }, // default - matches the global theme accent
  rose: { accent: "#c98a86", strong: "#dba9a5" },
  sage: { accent: "#8ea88a", strong: "#a9c2a5" },
  sapphire: { accent: "#7c93b8", strong: "#9db0d1" },
  amber: { accent: "#c99a5b", strong: "#dcb87e" },
  violet: { accent: "#9c86b8", strong: "#b7a3cf" },
  teal: { accent: "#6fa3a0", strong: "#8fc0bd" },
} as const;

export type GroupColorKey = keyof typeof GROUP_COLORS;

export const GROUP_COLOR_KEYS = Object.keys(GROUP_COLORS) as GroupColorKey[];

export function isGroupColorKey(value: string): value is GroupColorKey {
  return value in GROUP_COLORS;
}

export function groupColor(key: string): { accent: string; strong: string } {
  return isGroupColorKey(key) ? GROUP_COLORS[key] : GROUP_COLORS.gold;
}

// Small curated icon set (emoji glyphs - zero new dependency, renders
// consistently without an icon-font/library addition for a single feature).
export const GROUP_ICONS = ["💰", "🎁", "🏠", "🛒", "✈️", "❤️", "📚", "☕", "🎮", "🎓", "🚗", "⚡"] as const;