// FR-10: Profile & Preferences
// Style preferences are NOT a database column (schema is locked).
// They are stored in a local JSON file keyed by user id.

const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "..", "data", "stylePreferences.json");

const STYLE_PREFERENCES = [
  "Casual",
  "Formal",
  "Sporty",
  "Smart-Casual",
  "Minimalist",
  "Streetwear",
];

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function getStylePreferences(userId) {
  const all = readAll();
  const saved = all[String(userId)];
  return Array.isArray(saved) ? saved.filter((value) => STYLE_PREFERENCES.includes(value)) : [];
}

function saveStylePreferences(userId, values) {
  const cleaned = [
    ...new Set((Array.isArray(values) ? values : []).filter((value) => STYLE_PREFERENCES.includes(value))),
  ];
  const all = readAll();
  all[String(userId)] = cleaned;
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(all, null, 2));
  return cleaned;
}

module.exports = {
  STYLE_PREFERENCES,
  getStylePreferences,
  saveStylePreferences,
};
