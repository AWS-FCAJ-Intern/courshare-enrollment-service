// Lỗi tạm thời — nên retry (network, timeout, DB connection...)
export const TRANSIENT_DB_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "57P03", // Postgres: cannot_connect_now
  "53300", // Postgres: too_many_connections
]);

export class TransientError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TransientError';
  }
}

// Lỗi vĩnh viễn — không nên retry (data sai, business rule vi phạm...)
export class PermanentError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PermanentError';
  }
}