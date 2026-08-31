// FR-06: Style Me (Generative AI Prompt)
// HTTP adapter for Algorithm 3 (processStyleMeRequest).

const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { processStyleMeRequest } = require("../mockStyleMe");

const router = express.Router();
// Session check stays here so unauthenticated callers get 401 before work starts.
// processStyleMeRequest also returns AUTH_REQUIRED if userId is missing.
router.use(requireAuth);

// Map the algorithm's error codes to HTTP statuses the frontend already handles.
const STATUS_BY_CODE = {
  AUTH_REQUIRED: 401,
  PREMIUM_REQUIRED: 403,
  PROMPT_EMPTY: 400,
  PROMPT_TOO_LONG: 400,
  PROMPT_MODERATED: 400,
  WARDROBE_TOO_SMALL: 400,
  AI_SERVICE_UNAVAILABLE: 503,
  NO_VALID_ITEMS: 400,
};

router.post("/generate", async (req, res) => {
  try {
    const result = await processStyleMeRequest({
      userId: req.session.userId,
      prompt: req.body?.prompt,
    });

    if (result.error) {
      const status = STATUS_BY_CODE[result.code] || 400;
      const body = { error: result.error, code: result.code };
      // Frontend StyleMe.jsx still looks for upgrade: true on premium blocks.
      if (result.code === "PREMIUM_REQUIRED") {
        body.upgrade = true;
      }
      return res.status(status).json(body);
    }

    // Algorithm 3 returns { outfitItems, rationale, stylingTips }.
    // Wrap as { outfit } so the existing /api/styleme/generate client keeps working.
    return res.json({
      outfitItems: result.outfitItems,
      rationale: result.rationale,
      stylingTips: result.stylingTips,
      outfit: {
        items: result.outfitItems,
        rationale: result.rationale,
        tips: result.stylingTips,
        name: "StyleMe look",
        occasionTag: "Custom",
      },
    });
  } catch (err) {
    console.error("StyleMe error:", err);
    return res.status(500).json({ error: "Could not create a look. Please try again." });
  }
});

module.exports = router;
