/*
  Warnings:

  - You are about to drop the column `Customer` on the `AddParcel` table. All the data in the column will be lost.
  - You are about to drop the column `Description` on the `AddParcel` table. All the data in the column will be lost.
  - You are about to drop the column `Name` on the `AddParcel` table. All the data in the column will be lost.
  - You are about to drop the column `Weight` on the `AddParcel` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[trackingId]` on the table `AddParcel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `AddParcel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `AddParcel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `AddParcel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AddParcel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `AddParcel` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'AWAITING_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'NOT_DELIVERED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- AlterTable
ALTER TABLE "AddParcel" DROP COLUMN "Customer",
DROP COLUMN "Description",
DROP COLUMN "Name",
DROP COLUMN "Weight",
ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "invoice" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "pickupDate" TIMESTAMP(3),
ADD COLUMN     "status" "ParcelStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "trackingId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weight" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AddParcel_trackingId_key" ON "AddParcel"("trackingId");

-- AddForeignKey
ALTER TABLE "AddParcel" ADD CONSTRAINT "AddParcel_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
