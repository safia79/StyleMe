// FR-03: Clothing Upload & AI Tagging

const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { isValidTags } = require("../tagOptions");
const { mockAnalyseClothingImage } = require("../mockAi");

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

function deleteUploadFile(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const filename = path.basename(imageUrl);
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// Upload the photo, then run the mock AI and return suggested tags
router.post("/upload", async (req, res) => {
  try {
    await runUpload(req, res);

    if (!req.file) {
      return res.status(400).json({ error: "Please choose a JPG, PNG, or WEBP image." });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // MOCK AI — replace with real image recognition API later
    const tags = await mockAnalyseClothingImage(req.file);

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

// Edit tags and/or favourite flag
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Item not found." });
    }

    const existing = await prisma.wardrobeItem.findFirst({
      where: { id, userId: req.session.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Item not found." });
    }

    const data = {};

    if (req.body.isFavourite !== undefined) {
      data.isFavourite = Boolean(req.body.isFavourite);
    }

    const maybeTags = {
      category: req.body.category ?? existing.category,
      colour: req.body.colour ?? existing.colour,
      style: req.body.style ?? existing.style,
      formality: req.body.formality ?? existing.formality,
      season: req.body.season ?? existing.season,
    };

    const tagFieldsChanged = ["category", "colour", "style", "formality", "season"].some(
      (field) => req.body[field] !== undefined,
    );

    if (tagFieldsChanged) {
      if (!isValidTags(maybeTags)) {
        return res.status(400).json({ error: "Please choose a tag from each dropdown." });
      }
      Object.assign(data, maybeTags);
    }

    const item = await prisma.wardrobeItem.update({
      where: { id },
      data,
    });

    return res.json({ item });
  } catch (err) {
    console.error("Update item error:", err);
    return res.status(500).json({ error: "Could not update this item." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Item not found." });
    }

    const existing = await prisma.wardrobeItem.findFirst({
      where: { id, userId: req.session.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Item not found." });
    }

    await prisma.wardrobeItem.delete({ where: { id } });
    deleteUploadFile(existing.imageUrl);

    return res.json({ message: "Item deleted" });
  } catch (err) {
    console.error("Delete item error:", err);
    return res.status(500).json({ error: "Could not delete this item." });
  }
});

module.exports = router;
