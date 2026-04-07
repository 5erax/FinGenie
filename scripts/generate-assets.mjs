/**
 * Generate professional FinGenie app icon and splash assets.
 * Run: node scripts/generate-assets.mjs
 */
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "apps", "mobile", "assets");

// Brand colors
const BG = "#09090b";
const ACCENT = "#a78bfa";
const ACCENT_LIGHT = "#c4b5fd";
const WHITE = "#ffffff";

/**
 * Create an SVG sparkle icon (3-point star burst) — the FinGenie brand mark.
 */
function createSparkleSvg(
  size,
  iconColor = WHITE,
  bgColor = ACCENT,
  withBg = true,
) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.28; // main sparkle radius
  const r2 = size * 0.15; // secondary sparkle
  const r3 = size * 0.09; // tertiary sparkle

  // 4-pointed star path
  function star(x, y, outerR, innerR) {
    const points = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      points.push(
        `${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`,
      );
    }
    return `M${points.join("L")}Z`;
  }

  const bgRect = withBg
    ? `<defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7c3aed"/>
          <stop offset="50%" style="stop-color:${ACCENT}"/>
          <stop offset="100%" style="stop-color:#818cf8"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bgRect}
    <path d="${star(cx, cy, r, r * 0.35)}" fill="${iconColor}" opacity="1"/>
    <path d="${star(cx + r * 0.85, cy - r * 0.85, r2, r2 * 0.3)}" fill="${iconColor}" opacity="0.8"/>
    <path d="${star(cx - r * 0.6, cy + r * 1.0, r3, r3 * 0.3)}" fill="${iconColor}" opacity="0.6"/>
  </svg>`;
}

/**
 * Create splash icon SVG — sparkle centered on dark background.
 */
function createSplashSvg(size) {
  const iconSize = size * 0.3;
  const cx = size / 2;
  const cy = size / 2;
  const r = iconSize * 0.45;
  const r2 = iconSize * 0.25;
  const r3 = iconSize * 0.15;

  function star(x, y, outerR, innerR) {
    const points = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      points.push(
        `${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`,
      );
    }
    return `M${points.join("L")}Z`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${BG}"/>
    <defs>
      <linearGradient id="sparkle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${ACCENT_LIGHT}"/>
        <stop offset="100%" style="stop-color:${ACCENT}"/>
      </linearGradient>
    </defs>
    <path d="${star(cx, cy, r, r * 0.35)}" fill="url(#sparkle)"/>
    <path d="${star(cx + r * 0.85, cy - r * 0.85, r2, r2 * 0.3)}" fill="url(#sparkle)" opacity="0.8"/>
    <path d="${star(cx - r * 0.55, cy + r * 0.95, r3, r3 * 0.3)}" fill="url(#sparkle)" opacity="0.55"/>
  </svg>`;
}

async function generate() {
  console.log("Generating FinGenie assets...");

  // 1. App icon (1024x1024 → will be resized by EAS/stores)
  const iconSvg = createSparkleSvg(1024);
  await sharp(Buffer.from(iconSvg)).png().toFile(join(ASSETS_DIR, "icon.png"));
  console.log("  ✓ icon.png (1024x1024)");

  // 2. Adaptive icon foreground (1024x1024, no background — Android clips to circle/shape)
  const adaptiveSvg = createSparkleSvg(1024, WHITE, "transparent", false);
  // Add padding for adaptive icon safe zone (66% of 1024 ≈ 676 centered)
  const adaptivePadded = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="${ACCENT}" rx="0"/>
    <g transform="translate(176, 176) scale(0.656)">${createSparkleSvg(
      1024,
      WHITE,
      "transparent",
      false,
    )
      .replace(/<svg[^>]*>/, "")
      .replace("</svg>", "")}</g>
  </svg>`;
  await sharp(Buffer.from(adaptivePadded))
    .png()
    .toFile(join(ASSETS_DIR, "adaptive-icon.png"));
  console.log("  ✓ adaptive-icon.png (1024x1024)");

  // 3. Splash icon (centered sparkle on dark bg)
  const splashSvg = createSplashSvg(1284);
  await sharp(Buffer.from(splashSvg))
    .png()
    .toFile(join(ASSETS_DIR, "splash-icon.png"));
  console.log("  ✓ splash-icon.png (1284x1284)");

  // 4. Favicon (64x64)
  const faviconSvg = createSparkleSvg(64);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(join(ASSETS_DIR, "favicon.png"));
  console.log("  ✓ favicon.png (64x64)");

  console.log("\nDone! All assets generated in apps/mobile/assets/");
}

generate().catch(console.error);
