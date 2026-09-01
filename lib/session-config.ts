// lib/session-config.ts
// Shared iron-session configuration. The session encryption password is
// decoupled from ADMIN_PASSWORD because iron-session requires a password of
// at least 32 characters, while ADMIN_PASSWORD is a short human-chosen login
// password (e.g. "admin123" for local dev).
export const SESSION_COOKIE = "atelie-caro-admin";

const DEV_SESSION_PASSWORD =
  "atelie-caro-dev-session-secret-change-me-please-32chars";

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error(
    "SESSION_SECRET is required in production. Set it to a random value of at least 32 characters."
  );
}

export const SESSION_PASSWORD =
  process.env.SESSION_SECRET || DEV_SESSION_PASSWORD;
