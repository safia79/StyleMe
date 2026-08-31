// FR-05: Weather-Based Filtering
// HTTP wrapper around weather.js so the frontend can GET /api/weather.

const express = require("express");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { fetchCityWeather } = require("../weather");

const router = express.Router();
router.use(requireAuth);

// GET /api/weather — current weather for ?city= or the user's saved city.
router.get("/", async (req, res) => {
  try {
    let city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    // No query param → fall back to the city stored on the profile.
    if (!city) {
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        select: { city: true },
      });
      city = (user && user.city ? user.city : "").trim();
    }

    const weather = await fetchCityWeather(city);
    if (!weather) {
      // 502 = we could not get a good answer from the weather provider.
      return res.status(502).json({ error: "Weather data unavailable" });
    }

    return res.json({ weather });
  } catch (err) {
    console.error("Weather route error:", err.name, err.message);
    if (err.cause) console.error("Weather route cause:", err.cause);
    return res.status(502).json({ error: "Weather data unavailable" });
  }
});

module.exports = router;
