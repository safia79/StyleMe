// FR-04: AI Outfit Recommendation
// FR-05: Weather-Based Filtering — uses cached city weather when available

const express = require("express");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { fetchCityWeather } = require("../weather");
const { mockRecommendOutfits, OCCASIONS } = require("../mockRecommend");

const router = express.Router();
router.use(requireAuth);

// Weather the React app already fetched (used if the server lookup fails).
function readClientWeather(body) {
  const temperature =
    typeof body.temperature === "number" && Number.isFinite(body.temperature)
      ? body.temperature
      : null;
  const conditions = typeof body.conditions === "string" && body.conditions.trim()
    ? body.conditions.trim()
    : null;
  return { temperature, conditions };
}

// Build 1–3 outfit suggestions from this user's wardrobe + optional filters.
router.post("/generate", async (req, res) => {
  try {
    const occasion = typeof req.body.occasion === "string" ? req.body.occasion : "";
    // These flags are set only when the user clicks a "show without …" button.
    const ignoreWeather = Boolean(req.body.ignoreWeather);
    const ignoreOccasion = Boolean(req.body.ignoreOccasion);
    const clientWeather = readClientWeather(req.body);

    if (occasion && !OCCASIONS.includes(occasion)) {
      return res.status(400).json({ error: "Please choose a valid occasion." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { city: true },
    });

    let weather = null;
    if (!ignoreWeather && user && user.city) {
      try {
        weather = await fetchCityWeather(user.city);
      } catch (err) {
        console.error("Recommendations weather lookup failed:", err.name, err.message);
      }
    }

    // Prefer live city weather; otherwise use what the client sent.
    const temperature =
      weather && typeof weather.temperature === "number"
        ? weather.temperature
        : clientWeather.temperature;
    const conditions = (weather && weather.conditions) || clientWeather.conditions;

    const items = await prisma.wardrobeItem.findMany({
      where: { userId: req.session.userId },
    });

    // MOCK AI — replace with real recommendation/API logic later
    const result = await mockRecommendOutfits(items, {
      occasion: ignoreOccasion ? "" : occasion,
      temperature: ignoreWeather ? null : temperature,
      conditions: ignoreWeather ? null : conditions,
      ignoreWeather,
      ignoreOccasion,
    });

    // Shortage is a successful response (200) with a message, not a 400 error.
    if (result.shortage) {
      return res.json({
        outfits: [],
        shortage: result.shortage,
        weatherShortage: result.shortage.type === "weather",
        temperature: result.temperature,
        conditions: result.conditions,
        message: result.shortage.message,
      });
    }

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      outfits: result.outfits,
      temperature,
      conditions: conditions || null,
      weatherShortage: false,
    });
  } catch (err) {
    console.error("Generate outfit error:", err);
    return res.status(500).json({ error: "Could not generate an outfit. Please try again." });
  }
});

module.exports = router;
