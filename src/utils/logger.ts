/**
 * FinSight — Frontend Logger
 * Lightweight console-based logging for client-side
 */

const isDev = process.env.NODE_ENV !== "production";
const runtimeConsole = globalThis.console;

const logger = {
  debug: (...args: unknown[]) => isDev && runtimeConsole.debug("[FinSight]", ...args),
  info: (...args: unknown[]) => runtimeConsole.info("[FinSight]", ...args),
  warn: (...args: unknown[]) => runtimeConsole.warn("[FinSight]", ...args),
  error: (...args: unknown[]) => runtimeConsole.error("[FinSight]", ...args),
};

export default logger;
