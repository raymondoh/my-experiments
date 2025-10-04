export type LogLevel = "info" | "warn" | "error";

function baseLog(level: LogLevel, message: string, ...args: unknown[]) {
  const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  logFn(message, ...args);
}

export const logger = {
  info: (message: string, ...args: unknown[]) => baseLog("info", message, ...args),
  warn: (message: string, ...args: unknown[]) => baseLog("warn", message, ...args),
  error: (message: string, ...args: unknown[]) => baseLog("error", message, ...args)
};
