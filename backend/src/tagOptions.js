// FR-03: Clothing Upload & AI Tagging
// Allowed tag values. Keep these in sync with frontend/src/tagOptions.js

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
