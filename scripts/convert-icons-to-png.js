#!/usr/bin/env node

/**
 * SVGアイコンをPNGに変換
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconsDir = path.join(__dirname, '../public/icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function convertSVGtoPNG() {
  console.log('🔄 Converting SVG icons to PNG...\n');

  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);

      console.log(`✓ Converted: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to convert icon-${size}x${size}.svg:`, error.message);
    }
  }

  // apple-touch-icon
  try {
    await sharp(path.join(iconsDir, 'apple-touch-icon.svg'))
      .resize(180, 180)
      .png()
      .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log('✓ Converted: apple-touch-icon.png');
  } catch (error) {
    console.error('✗ Failed to convert apple-touch-icon.svg:', error.message);
  }

  // favicon
  try {
    await sharp(path.join(__dirname, '../public/favicon.svg'))
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '../public/favicon.png'));
    console.log('✓ Converted: favicon.png');
  } catch (error) {
    console.error('✗ Failed to convert favicon.svg:', error.message);
  }

  console.log('\n✅ All icons converted to PNG successfully!');
}

convertSVGtoPNG().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
