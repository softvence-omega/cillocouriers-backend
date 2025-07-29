/*
  Warnings:

  - You are about to drop the column `attachementliveLink` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "attachementliveLink",
ADD COLUMN     "attachementLiveLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];
