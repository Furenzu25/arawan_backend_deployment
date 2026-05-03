export const RATE_LIMIT = {
  WINDOW_SECONDS: 60,
  MAX_REQUESTS: 60,
} as const;

export const WRITE_RATE_LIMIT = {
  WINDOW_MS: 60_000,
  MAX_REQUESTS: 10,
} as const;

export const BODY_LIMITS = {
  JSON_MAX_BYTES: 3 * 1024 * 1024,
  FORM_MAX_BYTES: 6 * 1024 * 1024,
} as const;

export const FILE_LIMITS = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_DATA_URL_LENGTH: 2_000_000,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
} as const;

export const CACHE_TTL = {
  DASHBOARD_MS: 30_000,
  REPORTS_MS: 60_000,
} as const;

export const IDEMPOTENCY_TTL_MS = 5 * 60_000;

export const LOAN = {
  INTEREST_RATE: 0.20,
  TERM_DAYS: 60,
  MIN_PRINCIPAL: 1000,
  MAX_PRINCIPAL: 500_000,
} as const;
