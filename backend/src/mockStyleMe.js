// ==============================================================================
// CHANGES MADE:
// 1. Added Prisma client import to directly fetch wardrobe items by userId.
// 2. Replaced Claude model endpoints with Google Gemini constants.
// 3. Added parseGeminiJson to strip Markdown code blocks before parsing JSON.
// 4. Replaced callClaude with callGemini using Google REST API (generateContent).
// 5. Enforced responseMimeType: "application/json" in Gemini config.
// 6. Updated processStyleMeRequest to accept ({ userId, prompt }), fetch items from DB,
//    and map returned item IDs back to full wardrobe item objects.
// 7. Exported both processStyleMeRequest and mockStyleMeLook for compatibility.
// ==============================================================================

const prisma = require("./db");

// CHANGED: Set Gemini API endpoint parameters instead of Anthropic
const GEMINI_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-3.5-flash";

// Helper: Empty / error payload generator
function emptyError(message, code) {
  return {
    success: false,
    error: message,
    code: code || "UNKNOWN_ERROR",
    outfitItems: [],
    rationale: "",
    stylingTips: [],
  };
}

// CHANGED: Added helper to parse Gemini response text and handle standard markdown fences
function parseGeminiJson(text) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1].trim() : raw;
  return JSON.parse(jsonText);
}

// CHANGED: Replaced callClaude() with callGemini() using fetch and GEMINI_API_KEY
async function callGemini(structuredPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in process.env");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: structuredPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload.error?.message || `Gemini HTTP ${response.status}`
    );
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return parseGeminiJson(text);
}

// Main handler for Style Me requests
async function processStyleMeRequest({ userId, prompt } = {}) {
  // 1. Auth check
  if (!userId) {
    return emptyError("Please log in to continue.", "AUTH_REQUIRED");
  }

  // 2. Fetch user's wardrobe items from database
  const wardrobeItems = await prisma.wardrobeItem.findMany({
    where: { userId },
  });

  if (!wardrobeItems || wardrobeItems.length < 2) {
    return emptyError(
      "Please add at least 2 items to your wardrobe so Style Me can create an outfit.",
      "INSUFFICIENT_WARDROBE"
    );
  }

  // 3. User account check (Premium feature validation)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountType: true },
  });

  if (!user || user.accountType !== "premium") {
    return emptyError(
      "Style Me is a Premium feature. Upgrade to unlock personalized AI styling.",
      "PREMIUM_REQUIRED"
    );
  }

  // 4. Construct items context for Gemini prompt
  const itemsContext = wardrobeItems
    .map(
      (item) =>
        `- ID: ${item.id}, Title: "${item.title || item.category}", Category: ${item.category}, Color: ${item.colour || item.color || "N/A"}`
    )
    .join("\n");

  const structuredPrompt = `
You are a personal fashion stylist assistant.
Given the following user items from their wardrobe:
${itemsContext}

User request/occasion: "${prompt || "Create a stylish overall look"}"

Respond ONLY with a valid JSON object matching this exact structure:
{
  "outfitItemIds": ["<id1>", "<id2>"],
  "rationale": "<explanation of why these match>",
  "stylingTips": ["<tip1>", "<tip2>", "<tip3>"]
}
`;

  // 5. Executing callGemini instead of callClaude
  let aiResponse;
  try {
    aiResponse = await callGemini(structuredPrompt);
  } catch (err) {
    console.error("Style Me Gemini error:", err);
    return emptyError(
      "Style Me is temporarily unavailable. Please try again shortly.",
      "AI_SERVICE_UNAVAILABLE"
    );
  }

  // 6. Map returned IDs back to full database items expected by the frontend UI
  const wardrobeById = new Map(wardrobeItems.map((item) => [String(item.id), item]));
  const validatedItems = (aiResponse.outfitItemIds || [])
    .map((id) => wardrobeById.get(String(id)))
    .filter(Boolean);

  if (validatedItems.length === 0) {
    return emptyError(
      "We couldn't build an outfit from your wardrobe for that request. Try another prompt.",
      "NO_VALID_ITEMS"
    );
  }

  return {
    success: true,
    outfitItems: validatedItems,
    rationale: aiResponse.rationale || "",
    stylingTips: (aiResponse.stylingTips || []).slice(0, 3),
  };
}

module.exports = {
  processStyleMeRequest,
  mockStyleMeLook: processStyleMeRequest,
};