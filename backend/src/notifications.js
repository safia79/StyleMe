// In-app notifications (wardrobe limit, premium upgrade, cancellation)

const prisma = require("./db");

async function createNotification(userId, { message, type }) {
  try {
    return await prisma.notification.create({
      data: { userId, message, type },
    });
  } catch (err) {
    console.error("Create notification error:", err);
    return null;
  }
}

async function createNotificationOnce(userId, { message, type }) {
  try {
    const existing = await prisma.notification.findFirst({
      where: { userId, message },
    });
    if (existing) return existing;
    return createNotification(userId, { message, type });
  } catch (err) {
    console.error("Create notification error:", err);
    return null;
  }
}

const MESSAGES = {
  wardrobeLimit: {
    type: "upgrade",
    message: "You've reached your free wardrobe limit. Upgrade to add more items.",
  },
  premiumWelcome: {
    type: "upgrade",
    message: "Welcome to Premium! Style Me and weather-aware recommendations are now unlocked.",
  },
  premiumCancelled: {
    type: "info",
    message: "Your Premium subscription has been cancelled.",
  },
};

module.exports = {
  createNotification,
  createNotificationOnce,
  MESSAGES,
};
