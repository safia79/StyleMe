// FR-04: AI Outfit Recommendation

const express = require("express");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { mockRecommendOutfits, OCCASIONS } = require("../mockRecommend");

const router = express.Router();
router.use(requireAuth);

router.post("/generate", async (req, res) => {
  try {
    const occasion = typeof req.body.occasion === "string" ? req.body.occasion : "";
    const temperature =
      typeof req.body.temperature === "number" && Number.isFinite(req.body.temperature)
        ? req.body.temperature
        : null;

    if (occasion && !OCCASIONS.includes(occasion)) {
      return res.status(400).json({ error: "Please choose a valid occasion." });
    }

    const items = await prisma.wardrobeItem.findMany({
      where: { userId: req.session.userId },
    });

    // MOCK AI — replace with real recommendation/API logic later
    const result = await mockRecommendOutfits(items, {
      occasion,
      temperature,
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ outfits: result.outfits, temperature });
  } catch (err) {
    console.error("Generate outfit error:", err);
    return res.status(500).json({ error: "Could not generate an outfit. Please try again." });
  }
});

module.exports = router;
