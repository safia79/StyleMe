// FR-13: OTP Login Verification (Two-Factor Authentication)
// In-memory OTP codes. Lost on server restart — same as passwordReset.js / MemoryStore.
// In production these would be stored hashed in the database and sent by email/SMS.

const crypto = require("crypto");

// FR-13: OTP Login Verification (Two-Factor Authentication)
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const codesByUserId = new Map(); // userId -> { code, expiresAt }

// FR-13: OTP Login Verification (Two-Factor Authentication)
// 6-digit numeric code, zero-padded (e.g. "048392").
function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

// FR-13: OTP Login Verification (Two-Factor Authentication)
// Issue a new code for this user. Map is keyed by userId, so this overwrites
// any unused code from a previous login or resend.
function createOtp(userId) {
  const code = generateOtp();
  codesByUserId.set(userId, { code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

// FR-13: OTP Login Verification (Two-Factor Authentication)
// One-time use: delete the stored code first (wrong guess or success), then
// check match + expiry. Returns the userId, or null if invalid/expired/missing.
function consumeOtp(userId, code) {
  if (userId == null || (typeof code !== "string" && typeof code !== "number")) {
    return null;
  }

  const row = codesByUserId.get(userId);
  codesByUserId.delete(userId);

  if (!row) {
    return null;
  }

  if (row.expiresAt < Date.now()) {
    return null;
  }

  if (String(code).trim() !== row.code) {
    return null;
  }

  return userId;
}

module.exports = {
  createOtp,
  consumeOtp,
};
