// FR-01: User Registration
// FR-02: User Login & Session
// Forgot password / reset password (dev token in API response until email exists)

const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const prisma = require("../db");
const { createResetToken, consumeResetToken } = require("../passwordReset");

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_ROUNDS = 10;

// Fields we are allowed to send back to the browser (never passwordHash)
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  city: true,
  accountType: true,
  createdAt: true,
};

function validateRegisterInput(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";

  if (!name) {
    return { error: "Please enter your name." };
  }
  if (!email) {
    return { error: "Please enter your email address." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!password) {
    return { error: "Please enter a password." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: "Password must be at least 8 characters." };
  }

  return { name, email, password, city };
}

function validateLoginInput(body) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !EMAIL_PATTERN.test(email) || !password) {
    // Same wording as a failed login so we do not hint what was wrong
    return { error: "Incorrect email or password. Please try again." };
  }

  return { email, password };
}

// FR-01: create an account, hash the password, then start a session
router.post("/register", async (req, res) => {
  try {
    const parsed = validateRegisterInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const { name, email, password, city } = parsed;

    // Check for a duplicate email before inserting (also unique in the database)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        error: "An account with this email already exists. Please log in or use a different email.",
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        city, // optional on the form; empty string if left blank (schema requires a string)
        lastLoginAt: new Date(),
      },
      select: publicUserSelect,
    });

    // Log them in immediately so they can be redirected to the Dashboard
    req.session.userId = user.id;

    return res.status(201).json({ user });
  } catch (err) {
    // Prisma unique constraint (in case two requests race)
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "An account with this email already exists. Please log in or use a different email.",
      });
    }

    console.error("Register error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// FR-02: check email + password, then store userId in the session cookie
router.post("/login", async (req, res) => {
  try {
    const parsed = validateLoginInput(req.body);
    if (parsed.error) {
      return res.status(401).json({ error: parsed.error });
    }

    const { email, password } = parsed;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        error: "Incorrect email or password. Please try again.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        error: "Incorrect email or password. Please try again.",
      });
    }

    const loggedInUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: publicUserSelect,
    });

    req.session.userId = loggedInUser.id;

    return res.json({ user: loggedInUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// FR-02: used on refresh / new tabs to restore the logged-in user
router.get("/me", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: publicUserSelect,
    });

    if (!user) {
      req.session.destroy(() => {});
      return res.json({ user: null });
    }

    return res.json({ user });
  } catch (err) {
    console.error("Session check error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// Forgot password: generate a reset token. No real email service in this project.
router.post("/forgot-password", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const payload = {
      message: "If that email is registered, a reset token has been generated.",
    };

    if (user) {
      const resetToken = createResetToken(user.id);
      // DEV ONLY — in production this would be emailed, never returned directly
      payload.resetToken = resetToken;
      payload.devNote = "DEV ONLY — in production this would be emailed, never returned directly";
    }

    return res.json(payload);
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : typeof req.body.newPassword === "string"
          ? req.body.newPassword
          : "";

    if (!token) {
      return res.status(400).json({ error: "Please enter the reset token." });
    }
    if (!password) {
      return res.status(400).json({ error: "Please enter a password." });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const userId = consumeResetToken(token);
    if (!userId) {
      return res.status(400).json({ error: "This reset link is invalid or has expired." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const updated = await prisma.user.updateMany({
      where: { id: userId },
      data: { passwordHash },
    });

    if (updated.count === 0) {
      return res.status(400).json({ error: "This reset link is invalid or has expired." });
    }

    return res.json({ message: "Password updated. You can log in with your new password." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// FR-02: Sign Out — destroy the session so other tabs / refreshes are logged out
router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.json({ message: "Signed out" });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Could not sign out. Please try again." });
    }

    res.clearCookie("connect.sid");
    return res.json({ message: "Signed out" });
  });
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL + "/login",
  }),
  (req, res) => {
    req.session.userId = req.user.id;
    res.redirect(process.env.FRONTEND_URL + "/dashboard");
  },
);

module.exports = router;
