// FR-04: AI Outfit Recommendation
// FR-06: Style Me (Generative AI Prompt) — save / list outfits

const express = require("express");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

async function attachItems(outfits, userId) {
  const ids = [
    ...new Set(
      outfits.flatMap((outfit) => (Array.isArray(outfit.itemIds) ? outfit.itemIds : [])),
    ),
  ];

  const items = ids.length
    ? await prisma.wardrobeItem.findMany({
        where: { userId, id: { in: ids } },
      })
    : [];

  const byId = Object.fromEntries(items.map((item) => [item.id, item]));

  return outfits.map((outfit) => ({
    ...outfit,
    items: (Array.isArray(outfit.itemIds) ? outfit.itemIds : [])
      .map((id) => byId[id])
      .filter(Boolean),
  }));
}

router.get("/", async (req, res) => {
  try {
    const outfits = await prisma.savedOutfit.findMany({
      where: { userId: req.session.userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ outfits: await attachItems(outfits, req.session.userId) });
  } catch (err) {
    console.error("List outfits error:", err);
    return res.status(500).json({ error: "Could not load saved outfits." });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const occasionTag =
      typeof req.body.occasionTag === "string" ? req.body.occasionTag.trim() : "Any";
    const itemIds = Array.isArray(req.body.itemIds) ? req.body.itemIds.map(Number) : [];

    if (!name) {
      return res.status(400).json({ error: "Please give this outfit a name." });
    }
    if (itemIds.length < 2 || itemIds.some((id) => !Number.isInteger(id))) {
      return res.status(400).json({ error: "An outfit needs at least 2 wardrobe items." });
    }

    const owned = await prisma.wardrobeItem.findMany({
      where: { userId: req.session.userId, id: { in: itemIds } },
      select: { id: true },
    });
    if (owned.length !== itemIds.length) {
      return res.status(400).json({ error: "One or more items are not in your wardrobe." });
    }

    const outfit = await prisma.savedOutfit.create({
      data: {
        userId: req.session.userId,
        name,
        occasionTag: occasionTag || "Any",
        itemIds,
      },
    });

    const [withItems] = await attachItems([outfit], req.session.userId);
    return res.status(201).json({ outfit: withItems });
  } catch (err) {
    console.error("Save outfit error:", err);
    return res.status(500).json({ error: "Could not save this outfit. Please try again." });
  }
});

module.exports = router;
