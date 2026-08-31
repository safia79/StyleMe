// FR-10: Profile & Preferences

const express = require("express");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { getStylePreferences, saveStylePreferences, STYLE_PREFERENCES } = require("../stylePreferences");

const router = express.Router();
router.use(requireAuth);

// Same public fields as auth — never send passwordHash to the browser.
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  city: true,
  accountType: true,
  createdAt: true,
};

// Merge DB user fields with style preferences from the JSON file.
function withPreferences(user) {
  return {
    ...user,
    stylePreferences: getStylePreferences(user.id),
  };
}

// Load the logged-in user's profile plus allowed preference chips.
router.get("/", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: publicUserSelect,
    });
    if (!user) {
      return res.status(401).json({ error: "Please log in to continue." });
    }
    return res.json({
      user: withPreferences(user),
      allowedPreferences: STYLE_PREFERENCES,
    });
  } catch (err) {
    console.error("Profile load error:", err);
    return res.status(500).json({ error: "Could not load your profile." });
  }
});

// Update name + city in the database; preferences stay in the JSON file.
router.patch("/", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const city = typeof req.body.city === "string" ? req.body.city.trim() : "";

    if (!name) {
      return res.status(400).json({ error: "Please enter your name." });
    }
    if (!city) {
      return res.status(400).json({ error: "Please enter your city." });
    }

    const user = await prisma.user.update({
      where: { id: req.session.userId },
      data: { name, city },
      select: publicUserSelect,
    });

    const stylePreferences = saveStylePreferences(req.session.userId, req.body.stylePreferences);

    return res.json({
      user: { ...user, stylePreferences },
      message: "Profile saved.",
    });
  } catch (err) {
    console.error("Profile save error:", err);
    return res.status(500).json({ error: "Could not save your profile. Please try again." });
  }
});

module.exports = router;
