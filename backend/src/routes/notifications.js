// In-app notification list and mark-as-read. Always scoped to the logged-in user.

const express = require("express");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

// Newest first so the bell dropdown shows recent messages at the top.
router.get("/", async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.session.userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ notifications });
  } catch (err) {
    console.error("List notifications error:", err);
    return res.status(500).json({ error: "Could not load notifications." });
  }
});

// Mark one notification read. userId in the where-clause stops ID guessing.
router.post("/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Notification not found." });
    }

    const existing = await prisma.notification.findFirst({
      where: { id, userId: req.session.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Notification not found." });
    }

    const updated = await prisma.notification.updateMany({
      where: { id: existing.id, userId: req.session.userId },
      data: { isRead: true },
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: "Notification not found." });
    }

    const notification = await prisma.notification.findFirst({
      where: { id: existing.id, userId: req.session.userId },
    });

    return res.json({ notification });
  } catch (err) {
    console.error("Mark notification read error:", err);
    return res.status(500).json({ error: "Could not update this notification." });
  }
});

module.exports = router;
