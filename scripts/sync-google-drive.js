#!/usr/bin/env node

/**
 * Sync Google Drive Felicity content to /public
 * Copies photos from ~/Google Drive/felicity-content/photos/ → ./public/images/
 * Copies videos from ~/Google Drive/felicity-content/videos/ → ./public/videos/
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/Users/doug';
const GD_ROOT = path.join(HOME, 'マイドライブ', 'felicity-content');
const GD_PHOTOS = path.join(GD_ROOT, 'photos');
const GD_VIDEOS = path.join(GD_ROOT, 'videos');
const PUBLIC_IMAGES = path.join(__dirname, '..', 'public', 'images');
const PUBLIC_VIDEOS = path.join(__dirname, '..', 'public', 'videos');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
  }
}

function copyFiles(source, dest, fileType) {
  if (!fs.existsSync(source)) {
    console.warn(`⚠ ${fileType} source not found: ${source}`);
    return 0;
  }

  ensureDir(dest);
  
  const files = fs.readdirSync(source).filter(f => !f.startsWith('.'));
  let copied = 0;

  files.forEach(file => {
    const srcPath = path.join(source, file);
    const destPath = path.join(dest, file);

    try {
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ ${file}`);
        copied++;
      }
    } catch (e) {
      console.error(`  ✗ Failed to copy ${file}: ${e.message}`);
    }
  });

  return copied;
}

console.log('🔄 Syncing Google Drive content...\n');

console.log('📸 Photos:');
const photosCopied = copyFiles(GD_PHOTOS, PUBLIC_IMAGES, 'Photos');
console.log(`  → ${photosCopied} photo(s) synced\n`);

console.log('🎥 Videos:');
const videosCopied = copyFiles(GD_VIDEOS, PUBLIC_VIDEOS, 'Videos');
console.log(`  → ${videosCopied} video(s) synced\n`);

console.log(`✅ Sync complete: ${photosCopied} photos, ${videosCopied} videos`);
