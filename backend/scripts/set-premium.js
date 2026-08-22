// FR-06: Style Me — local helper to mark an account premium for testing.
// Usage (from the backend folder): node scripts/set-premium.js you@example.com

const { PrismaClient } = require("@prisma/client");

const email = process.argv[2];
if (!email) {
  console.log("Usage: node scripts/set-premium.js you@example.com");
  process.exit(1);
}

const prisma = new PrismaClient();

prisma.user
  .update({
    where: { email: email.trim().toLowerCase() },
    data: { accountType: "premium" },
  })
  .then((user) => {
    console.log(`Updated ${user.email} to accountType=${user.accountType}`);
  })
  .catch((err) => {
    console.error("Could not update user. Check the email address.", err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
