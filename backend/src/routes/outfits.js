// FR-04: AI Outfit Recommendation
// FR-06: Style Me (Generative AI Prompt) — save / list outfits
// FR-09: Outfit History — rename, wear, delete
// FR-12: Manual Outfit Builder — POST / creates a saved_outfits row

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

async function findOwnedOutfit(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Outfit not found." });
    return null;
  }

  const outfit = await prisma.savedOutfit.findFirst({
    where: { id, userId: req.session.userId },
  });
  if (!outfit) {
    res.status(404).json({ error: "Outfit not found." });
    return null;
  }
  return outfit;
}

// FR-09: click name, edit, Enter to save
router.patch("/:id", async (req, res) => {
  try {
    const existing = await findOwnedOutfit(req, res);
    if (!existing) return;

    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      return res.status(400).json({ error: "Please enter an outfit name." });
    }

    await prisma.savedOutfit.updateMany({
      where: { id: existing.id, userId: req.session.userId },
      data: { name },
    });
    const outfit = await prisma.savedOutfit.findFirst({
      where: { id: existing.id, userId: req.session.userId },
    });
    const [withItems] = await attachItems([outfit], req.session.userId);
    return res.json({ outfit: withItems });
  } catch (err) {
    console.error("Rename outfit error:", err);
    return res.status(500).json({ error: "Could not rename this outfit." });
  }
});

// FR-09: Wear Today — bump wornCount and each item's wearCount
router.post("/:id/wear", async (req, res) => {
  try {
    const existing = await findOwnedOutfit(req, res);
    if (!existing) return;

    const itemIds = Array.isArray(existing.itemIds)
      ? existing.itemIds.map(Number).filter((id) => Number.isInteger(id))
      : [];

    const updates = [
      prisma.savedOutfit.updateMany({
        where: { id: existing.id, userId: req.session.userId },
        data: { wornCount: { increment: 1 } },
      }),
    ];
    if (itemIds.length) {
      updates.push(
        prisma.wardrobeItem.updateMany({
          where: { userId: req.session.userId, id: { in: itemIds } },
          data: { wearCount: { increment: 1 } },
        }),
      );
    }
    await prisma.$transaction(updates);

    const updated = await prisma.savedOutfit.findFirst({
      where: { id: existing.id, userId: req.session.userId },
    });
    const [withItems] = await attachItems([updated], req.session.userId);
    return res.json({ outfit: withItems });
  } catch (err) {
    console.error("Wear outfit error:", err);
    return res.status(500).json({ error: "Could not mark this outfit as worn." });
  }
});

// FR-09: delete the outfit row only — wardrobe items stay
router.delete("/:id", async (req, res) => {
  try {
    const existing = await findOwnedOutfit(req, res);
    if (!existing) return;

    await prisma.savedOutfit.deleteMany({
      where: { id: existing.id, userId: req.session.userId },
    });
    return res.json({ message: "Outfit deleted" });
  } catch (err) {
    console.error("Delete outfit error:", err);
    return res.status(500).json({ error: "Could not delete this outfit." });
  }
});

module.exports = router;
