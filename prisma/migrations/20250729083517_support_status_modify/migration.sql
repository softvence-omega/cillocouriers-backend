/*
  Warnings:

  - The values [CLOSED,REOPENED] on the enum `SupportStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SupportStatus_new" AS ENUM ('OPEN', 'PENDING', 'RESOLVED');
ALTER TABLE "tickets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tickets" ALTER COLUMN "status" TYPE "SupportStatus_new" USING ("status"::text::"SupportStatus_new");
ALTER TYPE "SupportStatus" RENAME TO "SupportStatus_old";
ALTER TYPE "SupportStatus_new" RENAME TO "SupportStatus";
DROP TYPE "SupportStatus_old";
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;
