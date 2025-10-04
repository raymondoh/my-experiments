/**
 * Lightweight server-side logger for structured output without external dependencies.
 *
 * @remarks
 * This module is intended for server-side usage only (API routes, server components, services).
 * Do not import into client components or browser-only bundles.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [k: string]: unknown;
}

export interface LogFields {
  msg: string;
  ctx?: LogContext;
  err?: unknown;
}

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isLogLevel = (value: string): value is LogLevel => {
  return value === "debug" || value === "info" || value === "warn" || value === "error";
};

const globalEnv = ((): Record<string, string | undefined> => {
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  }
  if (typeof globalThis !== "undefined") {
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
    if (env) {
      return env;
    }
  }
  return {};
})();

const resolveDefaultLevel = (): LogLevel => {
  const envLevel = (globalEnv.LOG_LEVEL ?? globalEnv.NEXT_PUBLIC_LOG_LEVEL)?.toLowerCase();
  if (envLevel && isLogLevel(envLevel)) {
    return envLevel;
  }
  const nodeEnv = (globalEnv.NODE_ENV ?? "production").toLowerCase();
  return nodeEnv === "development" || nodeEnv === "test" ? "debug" : "info";
};

let currentLevel: LogLevel = resolveDefaultLevel();

const serializeContext = (ctx?: LogContext): string | undefined => {
  if (!ctx || Object.keys(ctx).length === 0) {
    return undefined;
  }
  try {
    return JSON.stringify(ctx);
  } catch (error) {
    return JSON.stringify({ warning: "failed to serialize context", error: getErrorSummary(error) });
  }
};

const getTimestamp = (): string => new Date().toISOString();

const getErrorSummary = (err: unknown): Record<string, unknown> | undefined => {
  if (!err) {
    return undefined;
  }
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  if (typeof err === "object") {
    return {
      message: "Non-Error object",
      value: err,
    };
  }
  return {
    message: String(err),
  };
};

const shouldLog = (level: LogLevel): boolean => levelOrder[level] >= levelOrder[currentLevel];

const emit = (level: LogLevel, fields: LogFields): void => {
  if (!shouldLog(level)) {
    return;
  }

  const parts: string[] = [getTimestamp(), level.toUpperCase(), fields.msg];
  const ctxSerialized = serializeContext(fields.ctx);
  if (ctxSerialized) {
    parts.push(`ctx=${ctxSerialized}`);
  }
  if (fields.err) {
    const summary = getErrorSummary(fields.err);
    if (summary) {
      parts.push(`err=${JSON.stringify(summary)}`);
    }
  }

  const line = parts.join(" ");

  switch (level) {
    case "debug":
      // eslint-disable-next-line no-console
      console.debug(line);
      break;
    case "info":
      // eslint-disable-next-line no-console
      console.info(line);
      break;
    case "warn":
      // eslint-disable-next-line no-console
      console.warn(line);
      break;
    case "error":
      // eslint-disable-next-line no-console
      console.error(line);
      break;
  }
};

/**
 * Update the global log level used for all logger invocations.
 *
 * @example
 * setLogLevel("debug");
 */
export const setLogLevel = (level: LogLevel): void => {
  currentLevel = level;
};

/**
 * Emit a debug-level message for verbose diagnostics.
 *
 * @remarks
 * Useful for temporary troubleshooting. Avoid enabling in production unless needed.
 */
export const debug = (msg: string, ctx?: LogContext): void => {
  emit("debug", { msg, ctx });
};

/**
 * Emit an info-level message for standard operational events.
 */
export const info = (msg: string, ctx?: LogContext): void => {
  emit("info", { msg, ctx });
};

/**
 * Emit a warn-level message for recoverable issues or unexpected states.
 */
export const warn = (msg: string, ctx?: LogContext): void => {
  emit("warn", { msg, ctx });
};

/**
 * Emit an error-level message including optional error details.
 */
export const error = (msg: string, err?: unknown, ctx?: LogContext): void => {
  emit("error", { msg, ctx, err });
};

/**
 * Create a namespaced logger that prefixes messages with a stable identifier.
 *
 * @example
 * const log = createLogger("products.list");
 * log.info("fetch", { limit: 20 });
 */
export const createLogger = (ns: string) => ({
  debug: (msg: string, ctx?: LogContext) => debug(`${ns} ${msg}`, ctx),
  info: (msg: string, ctx?: LogContext) => info(`${ns} ${msg}`, ctx),
  warn: (msg: string, ctx?: LogContext) => warn(`${ns} ${msg}`, ctx),
  error: (msg: string, err?: unknown, ctx?: LogContext) => error(`${ns} ${msg}`, err, ctx),
});
