#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Source and destination
const sourceDir = path.join(process.env.HOME, 'マイドライブ/felicity-content/photos/merch');
const destDir = path.join(__dirname, '../public/merch');

// Product folder mapping
const products = [
  'tshirt-drive-date-on-thing',
  'tshirt-peace-biker',
  'tshirt-la-motarde',
  'cap-grey',
  'cap-black',
  'hoodie-pullover',
  'sweatshirt-college',
  'tumbler'
];

// Create destination folder if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`✓ Created ${destDir}`);
}

// Sync images
let synced = 0;
let skipped = 0;

products.forEach((product) => {
  const productDir = path.join(sourceDir, product);
  
  // Check if folder exists
  if (!fs.existsSync(productDir)) {
    console.log(`⚠️  ${product}: folder not found`);
    skipped++;
    return;
  }
  
  // Get first image file (ignore .DS_Store and other system files)
  const files = fs.readdirSync(productDir).filter(
    file => /\.(jpg|jpeg|png|heic)$/i.test(file) && !file.startsWith('.')
  );
  
  if (files.length === 0) {
    console.log(`⚠️  ${product}: no images found`);
    skipped++;
    return;
  }
  
  const sourceFile = path.join(productDir, files[0]);
  const destFile = path.join(destDir, `${product}.jpg`);
  
  // Copy file
  try {
    fs.copyFileSync(sourceFile, destFile);
    console.log(`✓ ${product} ← ${files[0]}`);
    synced++;
  } catch (err) {
    console.error(`✗ ${product}: ${err.message}`);
    skipped++;
  }
});

console.log(`\n✓ Synced ${synced} products`);
if (skipped > 0) console.log(`⚠️  Skipped ${skipped}`);
