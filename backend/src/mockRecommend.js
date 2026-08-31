// FR-04: AI Outfit Recommendation
// FR-05: Weather-Based Filtering
// MOCK AI — replace with real recommendation/API logic later
// Picks outfits from the user's wardrobe using occasion + weather rules.
// Does not call an external AI API.

const {
  distinctCategories,
  buildRationale,
  pickDistinctCategoryItems,
  pickStructuredOutfit,
} = require("./outfitHelpers");

const OCCASIONS = ["Casual", "Work", "Formal", "Date Night"];

// Which wardrobe formality tags are allowed for each occasion dropdown value.
const OCCASION_FORMALITY = {
  Casual: ["Casual"],
  Work: ["Smart-Casual", "Formal"],
  Formal: ["Formal"],
  "Date Night": ["Smart-Casual", "Formal"],
};

const HOT_C = 25;
const COLD_C = 15;

// Fake thinking time so the recommendations page can show a spinner.
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Turn a temperature into hot / cold / mild. Invalid numbers count as mild.
function weatherBand(temperature) {
  if (typeof temperature !== "number" || !Number.isFinite(temperature)) return "mild";
  if (temperature >= HOT_C) return "hot";
  if (temperature < COLD_C) return "cold";
  return "mild";
}

function isWarmLayer(item) {
  // Coats/jackets count as warm even if their season tag is not Winter.
  return item.category === "Outerwear";
}

function isClearlyWarmWeatherOnly(item) {
  // Summer-tagged pieces are excluded when it is cold.
  return item.season === "Summer";
}

// Cold: drop summer pieces; keep outerwear; otherwise need Autumn/Winter.
function itemFitsColdWeather(item) {
  if (isClearlyWarmWeatherOnly(item)) return false;
  if (isWarmLayer(item)) return true;
  return item.season === "Winter" || item.season === "Autumn";
}

function itemFitsHotWeather(item) {
  // Hot day: no coats and no winter-only pieces.
  if (isWarmLayer(item)) return false;
  if (item.season === "Winter") return false;
  return true;
}

// Mild weather does not exclude anything.
function itemFitsWeather(item, band) {
  if (band === "cold") return itemFitsColdWeather(item);
  if (band === "hot") return itemFitsHotWeather(item);
  return true;
}

// Soft ranking: pick these seasons first when several items fit.
function preferredSeasonsForWeather(band) {
  if (band === "hot") return ["Summer", "All-season", "Spring"];
  if (band === "cold") return ["Winter", "Autumn"];
  return null;
}

function occasionFormalities(occasion) {
  return OCCASION_FORMALITY[occasion] || null; // unknown occasion → no formality filter
}

// No occasion selected → every formality is allowed.
function itemFitsOccasion(item, occasion) {
  const allowed = occasionFormalities(occasion);
  if (!allowed) return true;
  return allowed.includes(item.formality);
}

// Keep only items that pass the filters the caller turned on.
function applyFilters(items, { occasion, temperature, useOccasion, useWeather }) {
  const band = useWeather ? weatherBand(temperature) : "mild";

  return items.filter((item) => {
    if (useWeather && !itemFitsWeather(item, band)) return false;
    if (useOccasion && !itemFitsOccasion(item, occasion)) return false;
    return true;
  });
}

// Human-readable weather snippet for shortage messages ("6°C, Overcast").
function weatherPhrase(temperature, conditions) {
  const tempLabel = typeof temperature === "number" ? `${temperature}°C` : "the current weather";
  return conditions ? `${tempLabel}, ${conditions}` : tempLabel;
}

function categoryLabel(category) {
  return String(category || "item").toLowerCase(); // "Bottom" → "bottom" in the sentence
}

// Honest "not enough weather-appropriate clothes" result — no silent fallback.
function weatherShortagePayload(temperature, conditions) {
  const weather = weatherPhrase(temperature, conditions);
  return {
    shortage: {
      type: "weather",
      message: `Your wardrobe doesn't have enough weather-appropriate items for ${weather} right now. Consider adding a coat or warmer layer, or we can show you options without weather filtering.`,
    },
    outfits: [],
    temperature,
    conditions: conditions || null,
  };
}

// Honest "occasion + weather cannot be met" result — do not drop the occasion.
function occasionShortagePayload({ occasion, category, temperature, conditions }) {
  const weather = weatherPhrase(temperature, conditions);
  const piece = occasion ? occasion.toLowerCase() : "wardrobe";
  const message = category && category !== "outfit"
    ? `You don't have a ${occasion}-appropriate ${categoryLabel(category)} suited for ${weather} weather. Try a different occasion, or add a warmer ${piece} piece to your wardrobe.`
    : `You don't have enough ${occasion}-appropriate items suited for ${weather} weather. Try a different occasion, or add a warmer ${piece} piece to your wardrobe.`;

  return {
    shortage: {
      type: "occasion",
      occasion,
      missingCategory: category && category !== "outfit" ? category : null,
      message,
    },
    outfits: [],
    temperature,
    conditions: conditions || null,
  };
}

// Which core category is missing after weather+occasion? Prefer weather-blocked
// bottoms/tops/dresses so the message can say what to add.
function findMissingOccasionCategory(allItems, strictPool, occasion) {
  const allowed = occasionFormalities(occasion);
  if (!allowed) return null;

  const core = ["Bottom", "Top", "Dress"];
  const blockedByWeather = core.filter((category) => {
    const occasionItems = allItems.filter(
      (item) => item.category === category && allowed.includes(item.formality),
    );
    const remaining = strictPool.filter((item) => item.category === category);
    return occasionItems.length > 0 && remaining.length === 0;
  });

  if (blockedByWeather.includes("Bottom")) return "Bottom";
  if (blockedByWeather.includes("Top")) return "Top";
  if (blockedByWeather.includes("Dress")) return "Dress";

  const hasDress = strictPool.some((item) => item.category === "Dress");
  const hasTop = strictPool.some((item) => item.category === "Top");
  const hasBottom = strictPool.some((item) => item.category === "Bottom");
  if (hasDress || (hasTop && hasBottom)) return null;
  if (hasTop && !hasBottom) return "Bottom";
  if (hasBottom && !hasTop) return "Top";
  return "outfit";
}

// Up to 3 outfits using any 2+ categories (used when no occasion is selected).
function buildLooseOutfits(pool, preferredSeasons, occasionTag) {
  const outfits = [];
  const usedIds = new Set();

  for (let i = 0; i < 3; i += 1) {
    const unused = pool.filter((item) => !usedIds.has(item.id));
    const picked = pickDistinctCategoryItems(unused, null, null, preferredSeasons);
    if (!picked) break;
    picked.forEach((item) => usedIds.add(item.id));
    outfits.push({
      items: picked,
      rationale: buildRationale(picked, occasionTag || "everyday"),
      occasionTag: occasionTag || "Any",
      name: occasionTag ? `${occasionTag} look` : "Everyday look",
    });
  }

  return outfits;
}

// Up to 3 complete looks (dress, or top+bottom). Used when an occasion is on.
function buildStructuredOutfits(pool, preferredSeasons, occasionTag) {
  const outfits = [];
  const usedIds = new Set();

  for (let i = 0; i < 3; i += 1) {
    const unused = pool.filter((item) => !usedIds.has(item.id));
    const picked = pickStructuredOutfit(unused, preferredSeasons);
    if (!picked) break;
    picked.forEach((item) => usedIds.add(item.id));
    outfits.push({
      items: picked,
      rationale: buildRationale(picked, occasionTag || "everyday"),
      occasionTag: occasionTag || "Any",
      name: occasionTag ? `${occasionTag} look` : "Everyday look",
    });
  }

  return outfits;
}

// Main entry: filter the wardrobe, then either return outfits or a shortage.
// skipDelay is for tests. ignoreWeather / ignoreOccasion are explicit user opt-outs.
async function mockRecommendOutfits(
  items,
  { occasion, temperature, conditions, ignoreWeather, ignoreOccasion, skipDelay } = {},
) {
  if (!skipDelay) await delay(900);

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

  const occasionTag = !ignoreOccasion && OCCASIONS.includes(occasion) ? occasion : "";
  const useOccasion = Boolean(occasionTag);
  const useWeather =
    !ignoreWeather && typeof temperature === "number" && Number.isFinite(temperature);
  const band = useWeather ? weatherBand(temperature) : "mild";
  const preferredSeasons = useWeather ? preferredSeasonsForWeather(band) : null;

  const strictPool = applyFilters(items, {
    occasion: occasionTag,
    temperature,
    useOccasion,
    useWeather,
  });

  // Occasion stays strict: never swap in a Casual item for Formal.
  if (useOccasion) {
    if (!pickStructuredOutfit(strictPool, preferredSeasons)) {
      const missing = findMissingOccasionCategory(items, strictPool, occasionTag);
      return occasionShortagePayload({
        occasion: occasionTag,
        category: missing,
        temperature,
        conditions,
      });
    }

    const outfits = buildStructuredOutfits(strictPool, preferredSeasons, occasionTag);
    if (outfits.length === 0) {
      const missing = findMissingOccasionCategory(items, strictPool, occasionTag);
      return occasionShortagePayload({
        occasion: occasionTag,
        category: missing,
        temperature,
        conditions,
      });
    }

    return { outfits, shortage: null };
  }

  if (useWeather && (strictPool.length < 2 || distinctCategories(strictPool) < 2)) {
    return weatherShortagePayload(temperature, conditions);
  }

  const outfits = buildLooseOutfits(strictPool, preferredSeasons, occasionTag);
  if (outfits.length === 0) {
    if (useWeather) return weatherShortagePayload(temperature, conditions);
    return { error: "Could not build an outfit from the current wardrobe. Try adding more variety." };
  }

  return { outfits, shortage: null };
}

module.exports = {
  mockRecommendOutfits,
  OCCASIONS,
  itemFitsWeather,
  weatherBand,
};
