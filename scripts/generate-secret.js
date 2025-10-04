#!/usr/bin/env node

const crypto = require("crypto");

function generateSecret() {
  return crypto.randomBytes(32).toString("base64");
}

console.log("Generated NEXTAUTH_SECRET:");
const secret = generateSecret();
console.log(secret);
console.log("\nAdd this to your .env.local file:");
console.log(`NEXTAUTH_SECRET=${secret}`);
