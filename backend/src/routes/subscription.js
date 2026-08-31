// FR-08: Premium Subscription
// NFR-02: card numbers, CVCs and expiry dates are collected by Stripe's
// hosted iframe (Stripe Elements) in the browser and never sent here.
// This file only ever sees a PaymentIntent id, which Stripe itself has
// already validated — that's the "success token" the proposal describes.

const express = require("express");
const Stripe = require("stripe");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { createNotification, MESSAGES } = require("../notifications");

const router = express.Router();

// Stripe v17+ must be created lazily so the key is read after dotenv loads.
let stripeClient = null;

// Build (or reuse) the Stripe SDK. Throws if .env still has a placeholder key.
function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  const looksFake = /sk_test_xxx|REPLACE_ME|your.?key|placeholder/i.test(key) || key.length < 20;
  if (!key || !key.startsWith("sk_") || looksFake) {
    const error = new Error(
      "Stripe is not configured. Put your real secret key (sk_test_...) from https://dashboard.stripe.com/apikeys into backend/.env as STRIPE_SECRET_KEY, then restart the backend.",
    );
    error.code = "STRIPE_NOT_CONFIGURED";
    throw error;
  }
  if (!stripeClient) {
    stripeClient = Stripe(key);
  }
  return stripeClient;
}

// $9.99/month or $95.88/year (20% off), amounts in cents for Stripe
const PRICES = {
  monthly: { amount: 999 },
  annual: { amount: 9588 },
};
const CURRENCY = "aud";
const PAYMENT_SETUP_UNAVAILABLE =
  "Payment setup is temporarily unavailable — please try again later";

// Move a date forward one month or one year for the subscription expiry.
function addBillingPeriod(date, billingCycle) {
  const result = new Date(date);
  if (billingCycle === "annual") {
    result.setFullYear(result.getFullYear() + 1);
  } else {
    result.setMonth(result.getMonth() + 1);
  }
  return result;
}

// Latest subscription row for this user (by expiry date).
async function getSubscriptionForUser(userId) {
  return prisma.subscription.findFirst({
    where: { userId },
    orderBy: { expiryDate: "desc" },
  });
}

async function setUserPremium(userId) {
  // Flip the account flag used by Style Me and other premium checks.
  await prisma.user.update({
    where: { id: userId },
    data: { accountType: "premium" },
  });
}

async function setUserFree(userId) {
  // Used after cancel so Style Me and other premium gates lock again.
  await prisma.user.update({
    where: { id: userId },
    data: { accountType: "free" },
  });
}

// Update the latest row if one exists, otherwise insert (one plan per user).
async function upsertSubscription(userId, { customerRef, expiryDate, planStatus }) {
  const existing = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { expiryDate: "desc" },
  });

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: { customerRef, expiryDate, planStatus },
    });
  }

  return prisma.subscription.create({
    data: { userId, customerRef, expiryDate, planStatus },
  });
}

// GET /api/subscription/status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const subscription = await getSubscriptionForUser(req.session.userId);
    res.json({ subscription: subscription || null });
  } catch (err) {
    console.error("subscription/status error:", err.message);
    res.status(500).json({ error: "Could not load subscription status." });
  }
});

// POST /api/subscription/create-payment-intent
router.post("/create-payment-intent", requireAuth, async (req, res) => {
  const { billingCycle } = req.body;
  const price = PRICES[billingCycle] || PRICES.monthly;

  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: price.amount,
      currency: CURRENCY,
      payment_method_types: ["card"],
      metadata: {
        userId: String(req.session.userId),
        billingCycle: billingCycle === "annual" ? "annual" : "monthly",
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe create-payment-intent error:", err.type || err.code, err.message);
    const status = err.code === "STRIPE_NOT_CONFIGURED" ? 503 : 500;
    // Never send err.message — it can include the secret key when Stripe is misconfigured.
    res.status(status).json({
      error: PAYMENT_SETUP_UNAVAILABLE,
    });
  }
});

// POST /api/subscription/confirm
router.post("/confirm", requireAuth, async (req, res) => {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) {
    return res.status(400).json({ error: "Missing paymentIntentId." });
  }

  try {
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    // Do not credit premium if this PaymentIntent was created for another user.
    if (paymentIntent.metadata.userId !== String(req.session.userId)) {
      return res.status(403).json({ error: "This payment does not belong to your account." });
    }
    if (paymentIntent.status !== "succeeded") {
      return res.status(402).json({ error: "Your card was declined." });
    }

    const billingCycle = paymentIntent.metadata.billingCycle || "monthly";
    const expiryDate = addBillingPeriod(new Date(), billingCycle);

    await setUserPremium(req.session.userId);
    const subscription = await upsertSubscription(req.session.userId, {
      customerRef: paymentIntent.id,
      expiryDate,
      planStatus: "active",
    });
    await createNotification(req.session.userId, MESSAGES.premiumWelcome);

    res.json({ message: "You are now premium.", subscription });
  } catch (err) {
    console.error("Stripe confirm error:", err.message);
    res.status(500).json({ error: PAYMENT_SETUP_UNAVAILABLE });
  }
});

// POST /api/subscription/cancel
router.post("/cancel", requireAuth, async (req, res) => {
  try {
    const subscription = await getSubscriptionForUser(req.session.userId);
    if (!subscription) {
      return res.status(404).json({ error: "No subscription found." });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { planStatus: "canceled" },
    });
    await setUserFree(req.session.userId);
    await createNotification(req.session.userId, MESSAGES.premiumCancelled);

    res.json({ message: "Subscription canceled." });
  } catch (err) {
    console.error("subscription/cancel error:", err.message);
    res.status(500).json({ error: "Could not cancel your subscription." });
  }
});

// POST /api/subscription/start-trial
router.post("/start-trial", requireAuth, async (req, res) => {
  try {
    const existing = await getSubscriptionForUser(req.session.userId);
    if (existing) {
      return res.status(409).json({ error: "You've already used your free trial." });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 5); // 5-day trial, then they need to pay

    await setUserPremium(req.session.userId);
    // customerRef is required on the existing table; use "" because trials never touch Stripe.
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.session.userId,
        customerRef: "",
        expiryDate,
        planStatus: "trialing",
      },
    });
    await createNotification(req.session.userId, MESSAGES.premiumWelcome);

    res.json({ message: "Your 5-day free trial has started.", subscription });
  } catch (err) {
    console.error("subscription/start-trial error:", err.message);
    res.status(500).json({ error: "Could not start your free trial." });
  }
});

module.exports = router;
