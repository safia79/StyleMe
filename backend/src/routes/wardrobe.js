// FR-03: Clothing Upload & AI Tagging

const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { isValidTags } = require("../tagOptions");
const { analyseClothingImage } = require("../visionTag");

const router = express.Router();
router.use(requireAuth);

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.session.userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const typeOk = ALLOWED_TYPES.includes(file.mimetype);
    const extOk = ALLOWED_EXTENSIONS.includes(ext);
    if (!typeOk || !extOk) {
      return cb(new Error("Please upload a JPG, PNG, or WEBP image."));
    }
    cb(null, true);
  },
});

function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload.single("image")(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function mimeFromName(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

// Only allow tagging files this user already uploaded under /uploads.
function resolveOwnedUploadPath(imageUrl, userId) {
  if (typeof imageUrl !== "string" || !imageUrl.startsWith("/uploads/")) return null;
  const filename = path.basename(imageUrl);
  if (!filename.startsWith(`${userId}-`)) return null;
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) return null;
  return { path: filePath, mimetype: mimeFromName(filename) };
}

function deleteUploadFile(imageUrl, userId) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const filename = path.basename(imageUrl);
  if (!filename.startsWith(`${userId}-`)) return;
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function parseItemId(value) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

async function findOwnedItem(req, res) {
  const id = parseItemId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Item not found." });
    return null;
  }

  const item = await prisma.wardrobeItem.findFirst({
    where: { id, userId: req.session.userId },
  });
  if (!item) {
    res.status(404).json({ error: "Item not found." });
    return null;
  }
  return item;
}

function outfitContainsItem(itemIds, itemId) {
  if (!Array.isArray(itemIds)) return false;
  return itemIds.some((value) => Number(value) === itemId);
}

// Upload the photo, then auto-tag (Vision API) and return suggested tags
router.post("/upload", async (req, res) => {
  try {
    await runUpload(req, res);

    if (!req.file) {
      return res.status(400).json({ error: "Please choose a JPG, PNG, or WEBP image." });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // UC-04 / FR-03: Vision auto-tags so AddItemPanel can pre-fill the dropdowns.
    const tags = await analyseClothingImage(req.file);

    return res.json({ imageUrl, tags });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Image must be 10MB or smaller." });
    }
    if (err.message === "Please upload a JPG, PNG, or WEBP image.") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Could not upload the image. Please try again." });
  }
});

// UC-04 / FR-03: tag an image without saving a wardrobe row.
// Accepts multipart field "image" or JSON { imageUrl: "/uploads/..." } from a prior upload.
router.post("/auto-tag", async (req, res) => {
  try {
    const isMultipart = String(req.headers["content-type"] || "").includes("multipart/form-data");
    if (isMultipart) {
      await runUpload(req, res);
    }

    let file = req.file || null;
    let imageUrl = file ? `/uploads/${file.filename}` : null;

    if (!file) {
      const owned = resolveOwnedUploadPath(req.body?.imageUrl || req.body?.imagePath, req.session.userId);
      if (!owned) {
        return res.status(400).json({
          error: "Please upload a clothing image, or pass imageUrl from a previous upload.",
        });
      }
      file = owned;
      imageUrl = req.body.imageUrl || req.body.imagePath;
    }

    const tags = await analyseClothingImage(file);
    return res.json({ imageUrl, tags });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Image must be 10MB or smaller." });
    }
    if (err.message === "Please upload a JPG, PNG, or WEBP image.") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Auto-tag error:", err);
    return res.status(503).json({
      error: "Could not auto-tag this image. Please try again or set tags manually.",
    });
  }
});

// List this user's wardrobe items (newest first)
router.get("/", async (req, res) => {
  try {
    const items = await prisma.wardrobeItem.findMany({
      where: { userId: req.session.userId },
      orderBy: { uploadDate: "desc" },
    });
    return res.json({ items });
  } catch (err) {
    console.error("List wardrobe error:", err);
    return res.status(500).json({ error: "Could not load your wardrobe." });
  }
});

// Save a new item after the user reviews/edits the tags
router.post("/", async (req, res) => {
  try {
    const { imageUrl, category, colour, style, formality, season } = req.body;
    const tags = { category, colour, style, formality, season };

    if (typeof imageUrl !== "string" || !imageUrl.startsWith("/uploads/")) {
      return res.status(400).json({ error: "Please upload an image first." });
    }

    const filename = path.basename(imageUrl);
    if (!filename.startsWith(`${req.session.userId}-`)) {
      return res.status(400).json({ error: "Please upload an image first." });
    }

    if (!isValidTags(tags)) {
      return res.status(400).json({ error: "Please choose a tag from each dropdown." });
    }

    const item = await prisma.wardrobeItem.create({
      data: {
        userId: req.session.userId,
        imageUrl,
        category,
        colour,
        style,
        formality,
        season,
      },
    });

    return res.status(201).json({ item });
  } catch (err) {
    console.error("Save item error:", err);
    return res.status(500).json({ error: "Could not save this item. Please try again." });
  }
});

// Edit tags (same dropdown validation as the original upload form)
router.patch("/:id", async (req, res) => {
  try {
    const existing = await findOwnedItem(req, res);
    if (!existing) return;

    const tags = {
      category: req.body.category,
      colour: req.body.colour,
      style: req.body.style,
      formality: req.body.formality,
      season: req.body.season,
    };

    if (!isValidTags(tags)) {
      return res.status(400).json({ error: "Please choose a tag from each dropdown." });
    }

    await prisma.wardrobeItem.updateMany({
      where: { id: existing.id, userId: req.session.userId },
      data: tags,
    });

    const item = await prisma.wardrobeItem.findFirst({
      where: { id: existing.id, userId: req.session.userId },
    });

    return res.json({ item });
  } catch (err) {
    console.error("Update item error:", err);
    return res.status(500).json({ error: "Could not update this item." });
  }
});

// Flip isFavourite true/false for one owned item
router.post("/:id/favourite", async (req, res) => {
  try {
    const existing = await findOwnedItem(req, res);
    if (!existing) return;

    await prisma.wardrobeItem.updateMany({
      where: { id: existing.id, userId: req.session.userId },
      data: { isFavourite: !existing.isFavourite },
    });

    const item = await prisma.wardrobeItem.findFirst({
      where: { id: existing.id, userId: req.session.userId },
    });

    return res.json({ item });
  } catch (err) {
    console.error("Favourite item error:", err);
    return res.status(500).json({ error: "Could not update favourite." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await findOwnedItem(req, res);
    if (!existing) return;

    const outfits = await prisma.savedOutfit.findMany({
      where: { userId: req.session.userId },
      select: { itemIds: true },
    });
    const usedCount = outfits.filter((outfit) => outfitContainsItem(outfit.itemIds, existing.id)).length;
    if (usedCount > 0) {
      return res.status(409).json({
        error: `This item is used in ${usedCount} saved outfit${usedCount === 1 ? "" : "s"}`,
      });
    }

    await prisma.wardrobeItem.deleteMany({
      where: { id: existing.id, userId: req.session.userId },
    });
    deleteUploadFile(existing.imageUrl, req.session.userId);

    return res.json({ message: "Item deleted" });
  } catch (err) {
    console.error("Delete item error:", err);
    return res.status(500).json({ error: "Could not delete this item." });
  }
});

module.exports = router;
