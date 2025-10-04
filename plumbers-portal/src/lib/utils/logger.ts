// src/lib/utils/logger.ts
export const isProd = process.env.NODE_ENV === "production";

export function logDev(...args: unknown[]) {
  if (!isProd) console.log(...args);
}
export function warnDev(...args: unknown[]) {
  if (!isProd) console.warn(...args);
}
export function errorLog(...args: unknown[]) {
  // keep errors in prod, they’re useful
  console.error(...args);
}
