// FR-08: Premium Subscription

const express = require("express");
const prisma = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { mockCharge } = require("../mockPayment");

const router = express.Router();
router.use(requireAuth);

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  city: true,
  accountType: true,
  createdAt: true,
};

router.get("/status", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: publicUserSelect,
    });
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.session.userId },
      orderBy: { expiryDate: "desc" },
    });
    return res.json({ user, subscription });
  } catch (err) {
    console.error("Subscription status error:", err);
    return res.status(500).json({ error: "Could not load subscription status." });
  }
});

router.post("/checkout", async (req, res) => {
  try {
    const cardNumber = typeof req.body.cardNumber === "string" ? req.body.cardNumber : "";
    const simulateDecline = Boolean(req.body.simulateDecline);

    // MOCK PAYMENT — replace with real Stripe/payment integration later
    const charge = mockCharge({ cardNumber, simulateDecline });
    if (!charge.ok) {
      return res.status(402).json({ error: charge.error });
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.session.userId },
        data: { accountType: "premium" },
        select: publicUserSelect,
      }),
      prisma.subscription.create({
        data: {
          userId: req.session.userId,
          customerRef: charge.customerRef,
          expiryDate,
          planStatus: "active",
        },
      }),
    ]);

    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.session.userId },
      orderBy: { expiryDate: "desc" },
    });

    return res.json({
      user,
      subscription,
      message: "Upgrade successful. Premium features are unlocked.",
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Could not complete checkout. Please try again." });
  }
});

module.exports = router;
