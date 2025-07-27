/*
  Warnings:

  - You are about to drop the `attachments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_ticketId_fkey";

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "attachementliveLink" TEXT;

-- DropTable
DROP TABLE "attachments";
