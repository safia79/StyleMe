// FR-03: Clothing Upload & AI Tagging
// MOCK AI — replace with real image recognition API later
// This function ignores the actual photo and picks random-but-sensible tags
// from the fixed lists. Swap this for a real image API when you have one.

const { CATEGORIES, COLOURS, STYLES, FORMALITIES, SEASONS } = require("./tagOptions");

// Pick one random value from a list (used when we fake image recognition).
function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// MOCK AI — replace with real image recognition API later
// _file is unused on purpose: the mock never looks at the photo.
function mockAnalyseClothingImage(_file) {
  return new Promise((resolve) => {
    // Short pause so the UI can show a "analysing..." state.
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
