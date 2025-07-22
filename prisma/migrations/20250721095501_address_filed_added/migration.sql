/*
  Warnings:

  - Added the required column `addressId` to the `AddParcel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AddParcel" ADD COLUMN     "addressId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "AddParcel" ADD CONSTRAINT "AddParcel_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
