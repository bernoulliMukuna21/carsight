import { randomUUID } from "crypto";

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  correlationId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

/** Create a logger bound to a correlation ID for a single request. */
export function createLogger(correlationId = randomUUID()) {
  function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    // In V1 use structured console output. Swap for Sentry/Datadog later.
    if (level === "error") {
      console.error(JSON.stringify(entry));
    } else if (level === "warn") {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  return {
    correlationId,
    info: (message: string, meta?: Record<string, unknown>) =>
      log("info", message, meta),
    warn: (message: string, meta?: Record<string, unknown>) =>
      log("warn", message, meta),
    error: (message: string, meta?: Record<string, unknown>) =>
      log("error", message, meta),
    timed: async <T>(
      label: string,
      fn: () => Promise<T>,
      meta?: Record<string, unknown>
    ): Promise<T> => {
      const start = Date.now();
      try {
        const result = await fn();
        log("info", label, { ...meta, durationMs: Date.now() - start });
        return result;
      } catch (err) {
        log("error", `${label} failed`, {
          ...meta,
          durationMs: Date.now() - start,
          error: String(err),
        });
        throw err;
      }
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
