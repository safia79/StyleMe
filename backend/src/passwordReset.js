// In-memory reset tokens. Lost on server restart — same as express-session MemoryStore.
// In production these would be stored hashed in the database and sent by email.

const crypto = require("crypto");

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const tokensByValue = new Map(); // token -> { userId, expiresAt }

// 32 random bytes as hex = 64 characters, hard to guess.
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Issue a new token for this user and throw away any older unused ones
// so only the latest "forgot password" click works.
function createResetToken(userId) {
  for (const [token, row] of tokensByValue) {
    if (row.userId === userId) {
      tokensByValue.delete(token);
    }
  }

  const token = generateToken();
  tokensByValue.set(token, { userId, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

// One-time use: remove the token first, then reject it if it had expired.
// Returns the user id, or null if the token is missing/invalid/expired.
function consumeResetToken(token) {
  if (typeof token !== "string" || !token) {
    return null;
  }

  const row = tokensByValue.get(token);
  if (!row) {
    return null;
  }

  tokensByValue.delete(token);

  if (row.expiresAt < Date.now()) {
    return null;
  }

  return row.userId;
}

module.exports = {
  createResetToken,
  consumeResetToken,
};
