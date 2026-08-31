// FR: Foundation — project setup
// FR-01 / FR-02 / FR-03 / FR-04 / FR-06 / FR-08 / FR-09 / FR-10 / FR-12: shared Prisma client
// One shared Prisma client for the whole backend.
// Creating PrismaClient once (not in every route file) reuses one connection
// pool. Every `require("./db")` gets this same instance.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
