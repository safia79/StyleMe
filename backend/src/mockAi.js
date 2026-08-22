// FR-03: Clothing Upload & AI Tagging
// MOCK AI — replace with real image recognition API later
// This function ignores the actual photo and picks random-but-sensible tags
// from the fixed lists. Swap this for a real image API when you have one.

const { CATEGORIES, COLOURS, STYLES, FORMALITIES, SEASONS } = require("./tagOptions");

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// MOCK AI — replace with real image recognition API later
function mockAnalyseClothingImage(_file) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        category: pick(CATEGORIES),
        colour: pick(COLOURS),
        style: pick(STYLES),
        formality: pick(FORMALITIES),
        season: pick(SEASONS),
      });
    }, 1400);
  });
}

module.exports = { mockAnalyseClothingImage };
