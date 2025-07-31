/*
  Warnings:

  - You are about to drop the column `pickupDate` on the `AddParcel` table. All the data in the column will be lost.
  - You are about to drop the column `shipDay` on the `AddParcel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AddParcel" DROP COLUMN "pickupDate",
DROP COLUMN "shipDay";
