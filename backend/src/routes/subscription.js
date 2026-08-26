// FR-08: Premium Subscription
// NFR-02: card numbers, CVCs and expiry dates are collected by Stripe's
// hosted iframe (Stripe Elements) in the browser and never sent here.
// This file only ever sees a PaymentIntent id, which Stripe itself has
// already validated — that's the "success token" the proposal describes.

const express = require("express");
const Stripe = require("stripe");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// $9.99/month or $95.88/year (20% off), amounts in cents for Stripe
const PRICES = {
  monthly: { amount: 999 },
  annual: { amount: 9588 },
};
const CURRENCY = "aud";

function addBillingPeriod(date, billingCycle) {
  const result = new Date(date);
  if (billingCycle === "annual") {
    result.setFullYear(result.getFullYear() + 1);
  } else {
    result.setMonth(result.getMonth() + 1);
  }
  return result;
}

async function getSubscriptionForUser(userId) {
  return prisma.subscription.findFirst({
    where: { userId },
    orderBy: { expiryDate: "desc" },
  });
}

async function setUserPremium(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { accountType: "premium" },
  });
}

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
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.amount,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: String(req.session.userId),
        billingCycle: billingCycle === "annual" ? "annual" : "monthly",
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe create-payment-intent error:", err.message);
    res.status(500).json({ error: "Could not start checkout. Please try again." });
  }
});

// POST /api/subscription/confirm
router.post("/confirm", requireAuth, async (req, res) => {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) {
    return res.status(400).json({ error: "Missing paymentIntentId." });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

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

    res.json({ message: "You are now premium.", subscription });
  } catch (err) {
    console.error("Stripe confirm error:", err.message);
    res.status(500).json({ error: "We couldn't confirm your payment. Please contact support." });
  }
});

module.exports = router;
