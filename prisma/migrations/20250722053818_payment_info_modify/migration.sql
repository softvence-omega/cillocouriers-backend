/*
  Warnings:

  - You are about to drop the `BankAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CardPayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaypalAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('BANK', 'PAYPAL', 'CARD');

-- DropForeignKey
ALTER TABLE "BankAccount" DROP CONSTRAINT "BankAccount_marchentId_fkey";

-- DropForeignKey
ALTER TABLE "CardPayment" DROP CONSTRAINT "CardPayment_marchentId_fkey";

-- DropForeignKey
ALTER TABLE "PaypalAccount" DROP CONSTRAINT "PaypalAccount_marchentId_fkey";

-- DropTable
DROP TABLE "BankAccount";

-- DropTable
DROP TABLE "CardPayment";

-- DropTable
DROP TABLE "PaypalAccount";

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "marchentId" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "accountHolder" TEXT,
    "accountNumber" TEXT,
    "email" TEXT,
    "cardNumber" TEXT,
    "expiryDate" TEXT,
    "cvc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_marchentId_fkey" FOREIGN KEY ("marchentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
