// FR-04: AI Outfit Recommendation
// FR-06: Style Me (Generative AI Prompt)
// Shared helpers for mock outfit picking. Keep this simple and readable.

// Fisher–Yates shuffle so each generate does not always pick the same items.
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// How many different clothing categories are in this list (Top, Bottom, …).
function distinctCategories(items) {
  return new Set(items.map((item) => item.category)).size;
}

// Short sentence explaining why these pieces were grouped together.
function buildRationale(items, occasionLabel) {
  const first = items[0];
  const second = items[1];
  const look = occasionLabel || "everyday";

  if (items.length >= 3) {
    const third = items[2];
    return `This ${first.colour.toLowerCase()} ${first.category.toLowerCase()} pairs well with your ${second.colour.toLowerCase()} ${second.category.toLowerCase()} and ${third.colour.toLowerCase()} ${third.category.toLowerCase()} for a ${look} look.`;
  }

  return `This ${first.colour.toLowerCase()} ${first.category.toLowerCase()} pairs well with your ${second.colour.toLowerCase()} ${second.category.toLowerCase()} for a ${look} look.`;
}

// Pick 2-4 items, never two from the same category.
// preferredSeasons / deprioritizeItem are used by FR-05 weather filtering.
function pickDistinctCategoryItems(
  items,
  preferredFormalities,
  preferredStyles,
  preferredSeasons,
  deprioritizeItem,
) {
  const byCategory = {};
  for (const item of shuffle(items)) {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  }

  // Soft prefs: if nothing matches formality/style/season, keep the full pool.
  function bestFrom(category) {
    const pool = byCategory[category];
    if (!pool || pool.length === 0) return null;

    let ranked = pool;
    if (preferredFormalities && preferredFormalities.length) {
      const match = ranked.filter((item) => preferredFormalities.includes(item.formality));
      if (match.length) ranked = match;
    }
    if (preferredStyles && preferredStyles.length) {
      const match = ranked.filter((item) => preferredStyles.includes(item.style));
      if (match.length) ranked = match;
    }
    if (preferredSeasons && preferredSeasons.length) {
      const match = ranked.filter((item) => preferredSeasons.includes(item.season));
      if (match.length) ranked = match;
    }
    if (typeof deprioritizeItem === "function") {
      const preferred = ranked.filter((item) => !deprioritizeItem(item));
      if (preferred.length) ranked = preferred;
    }
    return ranked[0];
  }

  // Sometimes start with a dress instead of top+bottom, for variety.
  const dressFirst = Boolean(byCategory.Dress) && Math.random() < 0.45;
  const order = dressFirst
    ? ["Dress", "Shoes", "Outerwear", "Accessory", "Top", "Bottom"]
    : ["Top", "Bottom", "Shoes", "Outerwear", "Accessory", "Dress"];

  const picked = [];
  const used = new Set();

  for (const category of order) {
    if (used.has(category)) continue;
    const item = bestFrom(category);
    if (!item) continue;
    picked.push(item);
    used.add(category);
    if (picked.length >= 4) break;
  }

  // If the preferred order did not yield 2 items, grab any leftover categories.
  if (picked.length < 2) {
    for (const item of shuffle(items)) {
      if (used.has(item.category)) continue;
      picked.push(item);
      used.add(item.category);
      if (picked.length >= 2) break;
    }
  }

  return picked.length >= 2 ? picked : null;
}

// First item in the pool, preferring a matching season when one exists.
function pickByPrefs(pool, preferredSeasons) {
  if (!pool || pool.length === 0) return null;
  let ranked = pool;
  if (preferredSeasons && preferredSeasons.length) {
    const match = ranked.filter((item) => preferredSeasons.includes(item.season));
    if (match.length) ranked = match;
  }
  return ranked[0];
}

// Group items by category (after shuffle so ties are not always the same item).
function groupByCategory(items) {
  const byCategory = {};
  for (const item of shuffle(items)) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }
  return byCategory;
}

// Dress, or Top + Bottom. Extra layers optional. Never invent a 2-item
// outfit from Top + Outerwear when a bottom/dress is required.
function pickStructuredOutfit(items, preferredSeasons) {
  const byCategory = groupByCategory(items);

  // Optional extras only — never used as the "second item" instead of a bottom.
  function addExtras(picked, used) {
    for (const category of ["Shoes", "Outerwear", "Accessory"]) {
      if (picked.length >= 4) break;
      if (used.has(category)) continue;
      const extra = pickByPrefs(byCategory[category], preferredSeasons);
      if (!extra) continue;
      picked.push(extra);
      used.add(category);
    }
  }

  const dress = pickByPrefs(byCategory.Dress, preferredSeasons);
  if (dress) {
    const picked = [dress];
    const used = new Set(["Dress"]);
    addExtras(picked, used);
    if (picked.length >= 2) return picked;
  }

  const top = pickByPrefs(byCategory.Top, preferredSeasons);
  const bottom = pickByPrefs(byCategory.Bottom, preferredSeasons);
  if (top && bottom) {
    const picked = [top, bottom];
    const used = new Set(["Top", "Bottom"]);
    addExtras(picked, used);
    return picked;
  }

  return null;
}

// True if we have a Dress, or both a Top and a Bottom — enough for a full look.
function canBuildStructuredOutfit(items) {
  const categories = new Set(items.map((item) => item.category));
  if (categories.has("Dress")) return true;
  return categories.has("Top") && categories.has("Bottom");
}

module.exports = {
  shuffle,
  distinctCategories,
  buildRationale,
  pickDistinctCategoryItems,
  pickStructuredOutfit,
  canBuildStructuredOutfit,
};
