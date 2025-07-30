/*
  Warnings:

  - Added the required column `height` to the `AddParcel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `length` to the `AddParcel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `AddParcel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AddParcel" ADD COLUMN     "height" TEXT NOT NULL,
ADD COLUMN     "length" TEXT NOT NULL,
ADD COLUMN     "width" TEXT NOT NULL;
