// ============================================================================
// Module: visionTag.js (FR-03 / UC-04: Clothing Image Auto-Tagging)
// Description: Accepts an uploaded clothing photo, extracts base64 image data,
//              and calls the Google Gemini Vision API to auto-detect garment
//              attributes (category, colour, style, formality, season).
//              Normalizes raw output against project enums.
// ============================================================================

const fs = require("fs");
const path = require("path");
const { CATEGORIES, COLOURS, STYLES, FORMALITIES, SEASONS } = require("./tagOptions");
const { mockAnalyseClothingImage } = require("./mockAi");

// Gemini Vision model string (Defaults to gemini-1.5-flash)
const GEMINI_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-3.5-flash";

// File extension to MIME type map
const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Allowed tag options schema exported for reference
const TAG_SCHEMA = {
  category: CATEGORIES,
  colour: COLOURS,
  style: STYLES,
  formality: FORMALITIES,
  season: SEASONS,
};

// Strict prompt instructions ensuring AI selects ONLY from allowed enum arrays
const SYSTEM_PROMPT = [
  "You are StyleME clothing auto-tagger for UC-04 / FR-03.",
  "Look closely at the clothing garment in the photo and return ONLY a single valid JSON object with no markdown code blocks or extra key-value pairs.",
  "GARMENT ACCURACY INSTRUCTIONS:",
  "- CRITICAL: If the item is a dress or gown, category MUST be 'Dress'. Do not label dresses as Bottom or Top.",
  "- Identify top-wear vs bottom-wear correctly (pants, jeans, skirts are Bottom; t-shirts, hoodies, jackets are Top-wear).",
  "- Look at the actual dominant color of the fabric (e.g., if it is red, return Red. Do not default to Black or White).",
  "- Match WardrobeItem schema. The formality field is named 'formality'.",
  "- Every returned value MUST be selected strictly from the allowed lists provided below:",
  `category: ${JSON.stringify(CATEGORIES)}`,
  `colour: ${JSON.stringify(COLOURS)}`,
  `style: ${JSON.stringify(STYLES)}`,
  `formality: ${JSON.stringify(FORMALITIES)}`,
  `season: ${JSON.stringify(SEASONS)}`,
  'Required JSON shape: {"category":"...","colour":"...","style":"...","formality":"...","season":"..."}',
].join("\n");

/**
 * Helper: Resolve image MIME type from file path if not explicitly provided.
 */
function mimeFromPath(filePath, fallback) {
  const ext = path.extname(filePath || "").toLowerCase();
  return MIME_BY_EXT[ext] || fallback || "image/jpeg";
}

/**
 * Helper: Parses JSON string safely, stripping markdown code block fences if present.
 */
function parseJsonObject(text) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1].trim() : raw;
  const parsed = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Vision API response was not a valid JSON object");
  }
  return parsed;
}

/**
 * Helper: Snaps AI-generated string to nearest matching allowed tag from enum array.
 */
function snapToList(value, list) {
  if (list.includes(value)) return value;
  const lower = String(value || "").trim().toLowerCase();
  
  const exact = list.find((item) => item.toLowerCase() === lower);
  if (exact) return exact;

  if (lower === "gray") {
    const grey = list.find((item) => item.toLowerCase() === "grey");
    if (grey) return grey;
  }

  const partial = list.find(
    (item) => item.toLowerCase().includes(lower) || lower.includes(item.toLowerCase())
  );
  return partial || list[0];
}

/**
 * Normalizes raw tag predictions into strict project enum values.
 */
function normalizeTags(raw) {
  const formality = raw.formality || raw.formality_level;
  return {
    category: snapToList(raw.category, CATEGORIES),
    colour: snapToList(raw.colour, COLOURS),
    style: snapToList(raw.style, STYLES),
    formality: snapToList(formality, FORMALITIES),
    season: snapToList(raw.season, SEASONS),
  };
}

/**
 * Google Gemini Vision API Handler (Native Endpoint)
 * Passes AQ. and AIza keys via the official x-goog-api-key header.
 */
async function callGeminiVision(apiKey, mimeType, base64) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT + "\n\nTag this clothing item using only the allowed enum values." },
            { inlineData: { mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("GEMINI API ERROR RESPONSE:", JSON.stringify(payload, null, 2));
    throw new Error(payload.error?.message || `Gemini HTTP ${response.status}`);
  }

  const text = (payload.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n");
    
  return parseJsonObject(text);
}

/**
 * Primary Controller: Analyzes uploaded clothing photo using Gemini Vision.
 * Falls back to mock data if API key is missing or calls fail.
 */
async function analyseClothingImage(file) {
  const filePath = file?.path;
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("Image file not found on server disk");
  }

  const mimeType = file.mimetype || mimeFromPath(filePath);
  const base64 = fs.readFileSync(filePath).toString("base64");
  
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (geminiKey) {
    try {
      const raw = await callGeminiVision(geminiKey, mimeType, base64);
      console.log("Auto-tag success using Gemini Vision API");
      return { ...normalizeTags(raw), source: "gemini" };
    } catch (err) {
      console.warn("Gemini Vision call failed:", err.message);
    }
  } else {
    console.warn("FR-03 Warning: GEMINI_API_KEY not detected in process.env!");
  }

  console.warn("Falling back to local mock auto-tagger.");
  const mock = await mockAnalyseClothingImage(file);
  return { ...mock, source: "mock" };
}

module.exports = {
  TAG_SCHEMA,
  analyseClothingImage,
  autoTagImage: analyseClothingImage,
};