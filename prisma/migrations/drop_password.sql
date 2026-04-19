-- Migration: Remove password column from User table
-- Auth is handled entirely by Supabase; no password stored in app DB.
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "password" SET DEFAULT NULL;
UPDATE "User" SET "password" = NULL;
ALTER TABLE "User" DROP COLUMN "password";
