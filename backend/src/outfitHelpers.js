// FR-04: AI Outfit Recommendation
// FR-06: Style Me (Generative AI Prompt)
// Shared helpers for mock outfit picking. Keep this simple and readable.

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function distinctCategories(items) {
  return new Set(items.map((item) => item.category)).size;
}

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

// Pick 2-4 items, never two from the same category
function pickDistinctCategoryItems(items, preferredFormalities, preferredStyles) {
  const byCategory = {};
  for (const item of shuffle(items)) {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  }

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
    return ranked[0];
  }

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

module.exports = {
  shuffle,
  distinctCategories,
  buildRationale,
  pickDistinctCategoryItems,
};
