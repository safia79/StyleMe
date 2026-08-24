// FR-05: Weather-Based Filtering

const express = require("express");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { fetchCityWeather } = require("../weather");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    let city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    if (!city) {
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        select: { city: true },
      });
      city = (user && user.city ? user.city : "").trim();
    }

    const weather = await fetchCityWeather(city);
    if (!weather) {
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
