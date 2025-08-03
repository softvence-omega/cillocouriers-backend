/*
  Warnings:

  - The `shipdayOrderId` column on the `AddParcel` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AddParcel" DROP COLUMN "shipdayOrderId",
ADD COLUMN     "shipdayOrderId" INTEGER;
