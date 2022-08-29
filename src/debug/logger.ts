export interface Logger {
  assert(condition?: boolean, ...data: unknown[]): void;
  count(label?: string): void;
  countReset(label?: string): void;
  debug(...data: unknown[]): void;
  error(...data: unknown[]): void;
  info(...data: unknown[]): void;
  log(...data: unknown[]): void;
  table(tabularData?: unknown, properties?: string[]): void;
  trace(...data: unknown[]): void;
  warn(...data: unknown[]): void;
}

let logger: Logger = console

export function getLogger (): Logger {
  return logger
}

export function setLogger (newLogger: Logger): Logger {
  const original = logger
  logger = newLogger

  return original
}
