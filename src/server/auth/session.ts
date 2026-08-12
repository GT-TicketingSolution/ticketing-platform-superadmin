import crypto from "crypto";

export const SESSION_COOKIE = "superadmin_session";

export const SESSION_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days

export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
