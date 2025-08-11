/*
  Warnings:

  - The values [STARTED,ALREADY_DELIVERED,FAILED_DELIVERY,INCOMPLETE] on the enum `ParcelStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ParcelStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'PICKED_UP', 'EADY_TO_DELIVER');
ALTER TABLE "public"."AddParcel" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."AddParcel" ALTER COLUMN "status" TYPE "public"."ParcelStatus_new" USING ("status"::text::"public"."ParcelStatus_new");
ALTER TYPE "public"."ParcelStatus" RENAME TO "ParcelStatus_old";
ALTER TYPE "public"."ParcelStatus_new" RENAME TO "ParcelStatus";
DROP TYPE "public"."ParcelStatus_old";
ALTER TABLE "public"."AddParcel" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
