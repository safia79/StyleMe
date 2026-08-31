// FR-03: Clothing Upload & AI Tagging
// Allowed tag values. Keep these in sync with frontend/src/tagOptions.js

// These arrays are the only values the wardrobe form and auto-tagger may use.
const CATEGORIES = ["Top", "Bottom", "Dress", "Outerwear", "Shoes", "Accessory"];
const COLOURS = [
  "Black",
  "White",
  "Grey",
  "Navy",
  "Blue",
  "Red",
  "Pink",
  "Green",
  "Beige",
  "Brown",
  "Yellow",
  "Purple",
  "Orange",
];
const STYLES = ["Casual", "Formal", "Sporty", "Streetwear"];
const FORMALITIES = ["Casual", "Smart-Casual", "Formal"];
const SEASONS = ["Summer", "Winter", "Spring", "Autumn", "All-season"];

// True only if every tag field is one of the allowed strings (no free text).
function isValidTags(tags) {
  return (
    CATEGORIES.includes(tags.category) &&
    COLOURS.includes(tags.colour) &&
    STYLES.includes(tags.style) &&
    FORMALITIES.includes(tags.formality) &&
    SEASONS.includes(tags.season)
  );
}

module.exports = {
  CATEGORIES,
  COLOURS,
  STYLES,
  FORMALITIES,
  SEASONS,
  isValidTags,
};
