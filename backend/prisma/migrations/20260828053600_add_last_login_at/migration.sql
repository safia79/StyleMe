-- Add optional lastLoginAt to users. Updated on successful login.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
