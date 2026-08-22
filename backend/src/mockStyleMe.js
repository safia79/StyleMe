// FR-06: Style Me (Generative AI Prompt)
// MOCK AI — replace with real recommendation/API logic later

const {
  distinctCategories,
  buildRationale,
  pickDistinctCategoryItems,
} = require("./outfitHelpers");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const LIGHT_SHOE_COLOURS = ["White", "Beige", "Yellow", "Pink"];

function promptFlags(prompt) {
  const text = prompt.toLowerCase();
  return {
    rain: /\brain|raining|storm|drizzle|wet\b/.test(text),
    formal: /\bformal|wedding|gala|black.?tie|interview|office|work\b/.test(text),
    casual: /\bcasual|weekend|brunch|relax|chill|everyday\b/.test(text),
    date: /\bdate|dinner|night out\b/.test(text),
    sport: /\bgym|sport|run|workout|athletic\b/.test(text),
    hot: /\bhot|summer|beach|heat|sunny\b/.test(text),
    cold: /\bcold|winter|freeze|snow|chilly\b/.test(text),
  };
}

function occasionFromFlags(flags) {
  if (flags.formal) return "Formal";
  if (flags.date) return "Date Night";
  if (flags.sport || flags.casual) return "Casual";
  return "Custom";
}

function filterByPrompt(items, flags) {
  return items.filter((item) => {
    // "rain" avoids suede/light shoes (we have no material field, so light shoe colours stand in)
    if (flags.rain && item.category === "Shoes" && LIGHT_SHOE_COLOURS.includes(item.colour)) {
      return false;
    }
    if (flags.hot && item.category === "Outerwear") return false;
    if (flags.hot && item.season === "Winter") return false;
    if (flags.cold && item.season === "Summer") return false;
    return true;
  });
}

function buildTips(flags, items) {
  const tips = [];

  if (flags.rain) {
    tips.push("Skip light or suede-look shoes so they do not get stained in the rain.");
    tips.push("Bring a jacket you can take off once you are indoors.");
  }
  if (flags.formal) {
    tips.push("Keep accessories simple so the outfit stays polished.");
  }
  if (flags.date) {
    tips.push("One standout colour or accessory is enough for a date look.");
  }
  if (flags.hot) {
    tips.push("Choose breathable pieces and skip heavy outerwear.");
  }
  if (flags.cold) {
    tips.push("Start with a warm layer you can add or remove.");
  }
  if (flags.sport) {
    tips.push("Prioritise shoes you can move in comfortably.");
  }
  if (items.some((item) => item.category === "Outerwear") && !flags.hot) {
    tips.push("Wear the outer layer on the way, then drape it if the room is warm.");
  }

  if (tips.length === 0) {
    tips.push("Stick to two main colours so the look feels pulled together.");
    tips.push("Check that shoes match the formality of the rest of the outfit.");
  }

  return tips.slice(0, 3);
}

// MOCK AI — replace with real recommendation/API logic later
async function mockStyleMeLook(items, prompt) {
  await delay(900);

  if (!Array.isArray(items) || items.length < 2) {
    return {
      error: "Add at least 2 clothing items to your wardrobe before using StyleMe.",
    };
  }

  const flags = promptFlags(prompt);
  const occasionTag = occasionFromFlags(flags);

  let pool = filterByPrompt(items, flags);
  if (distinctCategories(pool) < 2) {
    pool = items;
  }

  let preferredFormalities = null;
  let preferredStyles = null;
  if (flags.formal) preferredFormalities = ["Formal", "Smart-Casual"];
  else if (flags.date) preferredFormalities = ["Smart-Casual", "Formal"];
  else if (flags.casual) preferredFormalities = ["Casual"];
  if (flags.sport) preferredStyles = ["Sporty"];

  const picked =
    pickDistinctCategoryItems(pool, preferredFormalities, preferredStyles) ||
    pickDistinctCategoryItems(items, null, null);

  if (!picked) {
    return { error: "Could not build a look from the current wardrobe. Try adding more variety." };
  }

  const shortPrompt = prompt.trim().slice(0, 40);
  const name = shortPrompt ? `StyleMe: ${shortPrompt}` : "StyleMe look";

  return {
    outfit: {
      items: picked,
      rationale: buildRationale(picked, occasionTag === "Custom" ? "styled" : occasionTag.toLowerCase()),
      tips: buildTips(flags, picked),
      occasionTag,
      name,
    },
  };
}

module.exports = { mockStyleMeLook };
