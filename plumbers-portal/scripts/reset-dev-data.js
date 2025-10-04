#!/usr/bin/env node

// Simple script to reset development data
const fs = require("fs");
const path = require("path");

console.log("🔄 Resetting development data...");

// Clear any local storage files if they exist
const tempFiles = [".next/cache", "node_modules/.cache"];

tempFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Clearing ${file}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log("✅ Development data reset complete!");
console.log("💡 Tip: Set APP_MODE=mock in your .env.local for faster testing");
console.log("🚀 Run: npm run dev to start fresh");
