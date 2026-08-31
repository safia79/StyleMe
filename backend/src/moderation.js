// Content moderation for Style Me prompts (Algorithm 3, step 5).
// Runs before Claude is called. Rejects prompts we cannot safely process.

// If any of these match, we refuse the Style Me prompt (no model call).
const BLOCKED_PATTERNS = [
  /\b(suicide|self[- ]?harm|kill myself)\b/i,
  /\b(child|minor|underage).{0,40}\b(sexual|nude|porn)\b/i,
  /\b(sexual|nude|porn).{0,40}\b(child|minor|underage)\b/i,
  /\b(bomb|explosive|make a weapon)\b/i,
  /\b(credit card|ssn|social security)\b/i,
];

/**
 * @param {string} prompt
 * @returns {{ allowed: boolean, reason?: string }}
 */
function moderatePrompt(prompt) {
  const text = String(prompt || ""); // treat missing prompt as empty string

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: "blocked_pattern" };
    }
  }

  return { allowed: true };
}

module.exports = { moderatePrompt };
