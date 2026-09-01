// lib/session-config.ts
// Shared iron-session configuration. The session encryption password is
// decoupled from ADMIN_PASSWORD because iron-session requires a password of
// at least 32 characters, while ADMIN_PASSWORD is a short human-chosen login
// password (e.g. "admin123" for local dev).
export const SESSION_COOKIE = "atelie-caro-admin";
export const SESSION_PASSWORD =
  process.env.SESSION_SECRET ||
  "atelie-caro-dev-session-secret-change-me-please-32chars";
