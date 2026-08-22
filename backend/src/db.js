// FR: Foundation — project setup
// FR-01 / FR-02 / FR-03 / FR-04 / FR-06: shared Prisma client
// One shared Prisma client for the whole backend.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
