// FR-06: Style Me (Generative AI Prompt)

const express = require("express");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { mockStyleMeLook } = require("../mockStyleMe");

const router = express.Router();
router.use(requireAuth);

const MAX_PROMPT = 300;

router.post("/generate", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { accountType: true },
    });

    if (!user || user.accountType !== "premium") {
      return res.status(403).json({
        error: "StyleMe is a premium feature. Please upgrade to continue.",
        upgrade: true,
      });
    }

    const prompt = typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) {
      return res.status(400).json({ error: "Please describe the occasion or look you want." });
    }
    if (prompt.length > MAX_PROMPT) {
      return res.status(400).json({ error: "Please keep your description to 300 characters." });
    }

    const items = await prisma.wardrobeItem.findMany({
      where: { userId: req.session.userId },
    });

    // MOCK AI — replace with real recommendation/API logic later
    const result = await mockStyleMeLook(items, prompt);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ outfit: result.outfit });
  } catch (err) {
    console.error("StyleMe error:", err);
    return res.status(500).json({ error: "Could not create a look. Please try again." });
  }
});

module.exports = router;
