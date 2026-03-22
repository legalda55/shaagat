// Generate simple PNG icons for PWA using canvas-like SVG approach
// Run: node scripts/generate-icons.js
import { writeFileSync } from "fs";

function createSVGIcon(size) {
  const fontSize = Math.round(size * 0.35);
  const subFontSize = Math.round(size * 0.09);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#0038B8"/>
  <text x="50%" y="38%" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-weight="800" font-size="${fontSize}" fill="white">₪</text>
  <text x="50%" y="62%" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-weight="600" font-size="${subFontSize}" fill="rgba(255,255,255,0.85)">פיצויים</text>
  <text x="50%" y="78%" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-weight="600" font-size="${Math.round(size * 0.07)}" fill="rgba(255,255,255,0.6)">2026</text>
</svg>`;
}

// Write SVG icons (browsers support SVG icons, and we'll also keep them as fallback)
writeFileSync("public/icons/icon-192.svg", createSVGIcon(192));
writeFileSync("public/icons/icon-512.svg", createSVGIcon(512));

// For PNG, create a minimal valid PNG with the SVG embedded
// Since we can't generate PNG without canvas/sharp, we'll use SVG directly
// Update manifest to use SVG
console.log("SVG icons generated. Updating manifest for SVG support...");

import { readFileSync } from "fs";
const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8"));
manifest.icons = [
  { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
  { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
];
writeFileSync("public/manifest.json", JSON.stringify(manifest, null, 2));
console.log("Done! Icons at public/icons/");
