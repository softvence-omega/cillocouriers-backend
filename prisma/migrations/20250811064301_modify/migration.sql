/*
  Warnings:

  - You are about to drop the column `deliveryStatus` on the `AddParcel` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."ParcelStatus" ADD VALUE 'COMPLETE';

-- AlterTable
ALTER TABLE "public"."AddParcel" DROP COLUMN "deliveryStatus";

-- DropEnum
DROP TYPE "public"."DeliveryStatus";
