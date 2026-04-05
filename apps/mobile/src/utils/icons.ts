/**
 * Shared icon mapping for category icons.
 * Maps category icon strings from the backend to Ionicons names.
 */
export const CATEGORY_ICON_MAP: Record<string, string> = {
  restaurant: "restaurant-outline",
  food: "fast-food-outline",
  "fast-food": "fast-food-outline",
  car: "car-outline",
  transport: "bus-outline",
  bus: "bus-outline",
  taxi: "car-outline",
  shopping: "bag-outline",
  bag: "bag-outline",
  cart: "cart-outline",
  home: "home-outline",
  house: "home-outline",
  rent: "home-outline",
  health: "medical-outline",
  medical: "medical-outline",
  hospital: "medical-outline",
  entertainment: "game-controller-outline",
  game: "game-controller-outline",
  education: "school-outline",
  school: "school-outline",
  salary: "cash-outline",
  cash: "cash-outline",
  investment: "trending-up-outline",
  gift: "gift-outline",
  travel: "airplane-outline",
  phone: "phone-portrait-outline",
  coffee: "cafe-outline",
  cafe: "cafe-outline",
  sport: "football-outline",
  fitness: "barbell-outline",
  beauty: "color-palette-outline",
  pet: "paw-outline",
  book: "book-outline",
  music: "musical-notes-outline",
  movie: "film-outline",
  insurance: "shield-outline",
  savings: "wallet-outline",
  wallet: "wallet-outline",
  utilities: "flash-outline",
  electric: "flash-outline",
  water: "water-outline",
  internet: "wifi-outline",
  gym: "barbell-outline",
  clothes: "shirt-outline",
  income: "trending-up-outline",
  expense: "trending-down-outline",
  bill: "document-text-outline",
  other: "ellipse-outline",
};

/**
 * Maps emoji strings (stored in DB seed) to Ionicons names.
 * Covers the default Vietnamese category emojis from prisma/seed.ts.
 */
const EMOJI_ICON_MAP: Record<string, string> = {
  "\u{1F35C}": "restaurant-outline", // 🍜
  "\u{1F697}": "car-outline", // 🚗
  "\u{1F6D2}": "cart-outline", // 🛒
  "\u{1F3AE}": "game-controller-outline", // 🎮
  "\u{1F48A}": "medical-outline", // 💊
  "\u{1F4DA}": "school-outline", // 📚
  "\u{1F4C4}": "document-text-outline", // 📄
  "\u{1F3E0}": "home-outline", // 🏠
  "\u{1F4B0}": "cash-outline", // 💰
  "\u{1F4C8}": "trending-up-outline", // 📈
  "\u{1F381}": "gift-outline", // 🎁
  "\u{1F4E6}": "cube-outline", // 📦
  // extra emojis users might use
  "\u{2615}": "cafe-outline", // ☕
  "\u{1F4B5}": "cash-outline", // 💵
  "\u{1F6EB}": "airplane-outline", // 🛫
  "\u{1F3CB}": "barbell-outline", // 🏋
  "\u{1F6CD}": "bag-outline", // 🛍
  "\u{1F4F1}": "phone-portrait-outline", // 📱
  "\u{1F3B5}": "musical-notes-outline", // 🎵
  "\u{1F3AC}": "film-outline", // 🎬
  "\u{1F6E1}": "shield-outline", // 🛡
  "\u{1F525}": "flash-outline", // 🔥
  "\u{1F4A7}": "water-outline", // 💧
  "\u{1F455}": "shirt-outline", // 👕
  "\u{1F436}": "paw-outline", // 🐶
  "\u{1F431}": "paw-outline", // 🐱
};

/**
 * Resolve a category icon string to an Ionicons name.
 * Falls back to "ellipse-outline" if no match found.
 * Handles both ASCII keyword strings and emoji strings from the database.
 */
export function resolveIcon(iconStr: string): string {
  if (!iconStr) return "ellipse-outline";

  // Check emoji map first (handles non-ASCII DB values like "🍜")
  const emojiMatch = EMOJI_ICON_MAP[iconStr];
  if (emojiMatch) return emojiMatch;

  // Reject remaining non-ASCII strings that aren't in our emoji map
  if (/[^\x20-\x7E]/.test(iconStr)) return "ellipse-outline";

  const lower = iconStr.toLowerCase();
  return (
    CATEGORY_ICON_MAP[iconStr] ??
    CATEGORY_ICON_MAP[lower] ??
    (iconStr.includes("-outline") || iconStr.includes("-sharp")
      ? iconStr
      : `${lower}-outline`)
  );
}
