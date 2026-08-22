// FR-04: AI Outfit Recommendation
// MOCK AI — replace with real recommendation/API logic later

const {
  distinctCategories,
  buildRationale,
  pickDistinctCategoryItems,
} = require("./outfitHelpers");

const OCCASIONS = ["Casual", "Work", "Formal", "Date Night"];

const OCCASION_FORMALITY = {
  Casual: ["Casual"],
  Work: ["Smart-Casual", "Formal"],
  Formal: ["Formal"],
  "Date Night": ["Smart-Casual", "Formal"],
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function excludedCategoriesForTemperature(temperature) {
  if (typeof temperature !== "number") return [];
  // Coats/jackets are clearly wrong on a hot day
  if (temperature >= 25) return ["Outerwear"];
  return [];
}

function excludedSeasonsForTemperature(temperature) {
  if (typeof temperature !== "number") return [];
  if (temperature >= 25) return ["Winter"];
  if (temperature <= 10) return ["Summer"];
  return [];
}

function applyFilters(items, { occasion, temperature, strictFormality, useWeather }) {
  const preferred = occasion ? OCCASION_FORMALITY[occasion] : null;
  const skipCategories = useWeather ? excludedCategoriesForTemperature(temperature) : [];
  const skipSeasons = useWeather ? excludedSeasonsForTemperature(temperature) : [];

  return items.filter((item) => {
    if (skipCategories.includes(item.category)) return false;
    if (item.season !== "All-season" && skipSeasons.includes(item.season)) return false;
    if (strictFormality && preferred && !preferred.includes(item.formality)) return false;
    return true;
  });
}

// MOCK AI — replace with real recommendation/API logic later
async function mockRecommendOutfits(items, { occasion, temperature } = {}) {
  await delay(900);

  if (!Array.isArray(items) || items.length < 2) {
    return {
      error: "Add at least 2 clothing items to your wardrobe before generating an outfit.",
    };
  }

  if (distinctCategories(items) < 2) {
    return {
      error: "Add items from at least 2 different categories (for example a Top and Shoes) so an outfit can be built.",
    };
  }

  const occasionTag = OCCASIONS.includes(occasion) ? occasion : "";
  const preferredFormalities = occasionTag ? OCCASION_FORMALITY[occasionTag] : null;

  let pool = applyFilters(items, {
    occasion: occasionTag,
    temperature,
    strictFormality: Boolean(occasionTag),
    useWeather: typeof temperature === "number",
  });

  if (distinctCategories(pool) < 2) {
    pool = applyFilters(items, {
      occasion: occasionTag,
      temperature,
      strictFormality: false,
      useWeather: typeof temperature === "number",
    });
  }

  if (distinctCategories(pool) < 2) {
    pool = items;
  }

  const outfits = [];
  const usedIds = new Set();

  for (let i = 0; i < 3; i += 1) {
    const unused = pool.filter((item) => !usedIds.has(item.id));
    const picked = pickDistinctCategoryItems(unused, preferredFormalities, null);
    if (!picked) break;
    picked.forEach((item) => usedIds.add(item.id));
    outfits.push({
      items: picked,
      rationale: buildRationale(picked, occasionTag || "everyday"),
      occasionTag: occasionTag || "Any",
      name: occasionTag ? `${occasionTag} look` : "Everyday look",
    });
  }

  if (outfits.length === 0) {
    const picked = pickDistinctCategoryItems(pool, preferredFormalities, null);
    if (picked) {
      outfits.push({
        items: picked,
        rationale: buildRationale(picked, occasionTag || "everyday"),
        occasionTag: occasionTag || "Any",
        name: occasionTag ? `${occasionTag} look` : "Everyday look",
      });
    }
  }

  if (outfits.length === 0) {
    return { error: "Could not build an outfit from the current wardrobe. Try adding more variety." };
  }

  return { outfits };
}

module.exports = { mockRecommendOutfits, OCCASIONS };
