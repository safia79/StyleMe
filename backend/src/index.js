// FR: Foundation — project setup
// FR-01: User Registration (auth routes)
// FR-02: User Login & Session (express-session + auth routes)
// FR-03: Clothing Upload & AI Tagging (wardrobe routes + /uploads)
// FR-04: AI Outfit Recommendation
// FR-06: Style Me (Generative AI Prompt)
// FR-08: Premium Subscription
// FR-09: Outfit History
// FR-10: Profile & Preferences
// FR-05: Weather-Based Filtering (Open-Meteo via /api/weather)
// FR-11: Wardrobe Analytics
// FR-12: Manual Outfit Builder

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const fs = require("fs");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const authRoutes = require("./routes/auth");
const wardrobeRoutes = require("./routes/wardrobe");
const outfitRoutes = require("./routes/outfits");
const recommendationRoutes = require("./routes/recommendations");
const styleMeRoutes = require("./routes/styleme");
const subscriptionRoutes = require("./routes/subscription");
const profileRoutes = require("./routes/profile");
const weatherRoutes = require("./routes/weather");
const notificationRoutes = require("./routes/notifications");

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGINS = [
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter((origin, index, list) => list.indexOf(origin) === index);

// Make sure the uploads folder exists even on a fresh clone
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Let the React app (different port) call this API, including cookies.
// Vite uses 5173 by default and 5174 if 5173 is already taken.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || FRONTEND_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());

// express-session stores login state in a cookie.
// MemoryStore is fine for this local student project (not for a real production server).
app.use(
  session({
    secret: process.env.SESSION_SECRET || "styleme-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // localhost uses http, so this must stay false
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }),
);

// Serve uploaded clothing images at http://localhost:3001/uploads/<filename>
app.use("/uploads", express.static(uploadsDir));

// Simple health-check so we can confirm the server is running
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "StyleME backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/wardrobe", wardrobeRoutes);
app.use("/api/outfits", outfitRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/styleme", styleMeRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/notifications", notificationRoutes);

app.listen(PORT, () => {
  console.log(`StyleME backend listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
