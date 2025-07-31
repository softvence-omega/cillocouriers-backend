/*
  Warnings:

  - The values [PROCESSING,COMPLETED,CANCELLED] on the enum `ParcelStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ParcelStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET', 'STARTED', 'PICKED_UP', 'READY_TO_DELIVER', 'ALREADY_DELIVERED', 'FAILED_DELIVERY', 'INCOMPLETE');
ALTER TABLE "AddParcel" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AddParcel" ALTER COLUMN "status" TYPE "ParcelStatus_new" USING ("status"::text::"ParcelStatus_new");
ALTER TYPE "ParcelStatus" RENAME TO "ParcelStatus_old";
ALTER TYPE "ParcelStatus_new" RENAME TO "ParcelStatus";
DROP TYPE "ParcelStatus_old";
ALTER TABLE "AddParcel" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
