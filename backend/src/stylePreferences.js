// FR-10: Profile & Preferences
// Style preferences are NOT a database column (schema is locked).
// They are stored in a local JSON file keyed by user id.

const fs = require("fs");
const path = require("path");

// JSON file lives next to the backend folder, not in the database.
const FILE_PATH = path.join(__dirname, "..", "data", "stylePreferences.json");

const STYLE_PREFERENCES = [
  "Casual",
  "Formal",
  "Sporty",
  "Smart-Casual",
  "Minimalist",
  "Streetwear",
];

// Read the whole file. Missing/broken file → empty object so first save still works.
function readAll() {
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  } catch {
    return {};
  }
}

// Preferences saved for this user, minus any values that are no longer allowed.
function getStylePreferences(userId) {
  const all = readAll();
  const saved = all[String(userId)];
  return Array.isArray(saved) ? saved.filter((value) => STYLE_PREFERENCES.includes(value)) : [];
}

// Keep only allowed unique values, write the file, and return what we stored.
function saveStylePreferences(userId, values) {
  // Set removes duplicates; filter drops anything not in STYLE_PREFERENCES.
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
