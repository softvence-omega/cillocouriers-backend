/*
  Warnings:

  - The values [ADMIN,MARCHANT] on the enum `USER_ROLE` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cardHolderName` on the `CardPayment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[marchentId]` on the table `BankAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[marchentId]` on the table `CardPayment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[marchentId]` on the table `PaypalAccount` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `role` on the `RestrictedUser` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "USER_ROLE_new" AS ENUM ('admin', 'marchant', 'dispatch', 'account', 'warehouse');
ALTER TABLE "User" ALTER COLUMN "Role" TYPE "USER_ROLE_new" USING ("Role"::text::"USER_ROLE_new");
ALTER TABLE "RestrictedUser" ALTER COLUMN "role" TYPE "USER_ROLE_new" USING ("role"::text::"USER_ROLE_new");
ALTER TYPE "USER_ROLE" RENAME TO "USER_ROLE_old";
ALTER TYPE "USER_ROLE_new" RENAME TO "USER_ROLE";
DROP TYPE "USER_ROLE_old";
COMMIT;

-- AlterTable
ALTER TABLE "CardPayment" DROP COLUMN "cardHolderName";

-- AlterTable
ALTER TABLE "RestrictedUser" DROP COLUMN "role",
ADD COLUMN     "role" "USER_ROLE" NOT NULL;

-- DropEnum
DROP TYPE "RESTRICTED_ROLE";

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_marchentId_key" ON "BankAccount"("marchentId");

-- CreateIndex
CREATE UNIQUE INDEX "CardPayment_marchentId_key" ON "CardPayment"("marchentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaypalAccount_marchentId_key" ON "PaypalAccount"("marchentId");
