#!/usr/bin/env node

/**
 * PWAアイコン生成スクリプト
 * SVGから各サイズのPNGアイコンを生成
 */

const fs = require('fs');
const path = require('path');

// SVGアイコンのテンプレート（青背景に白文字「D」）
const generateSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#3B82F6" rx="${size * 0.2}"/>

  <!-- Letter D -->
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="${size * 0.6}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="central"
  >D</text>
</svg>`;

// 生成するアイコンサイズ
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// 出力ディレクトリの作成
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 各サイズのSVGを生成
sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);

  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated: ${filename}`);
});

// apple-touch-icon（iOS用）も生成
const appleTouchIconSVG = generateSVG(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchIconSVG);
console.log('✓ Generated: apple-touch-icon.svg');

// favicon.svg（ブラウザタブ用）
const faviconSVG = generateSVG(32);
fs.writeFileSync(path.join(__dirname, '../public/favicon.svg'), faviconSVG);
console.log('✓ Generated: favicon.svg');

console.log('\n✅ All icons generated successfully!');
console.log('\nNote: SVG files created. For production, convert to PNG using:');
console.log('  - Online tool: https://cloudconvert.com/svg-to-png');
console.log('  - Or use sharp library for automated conversion');
