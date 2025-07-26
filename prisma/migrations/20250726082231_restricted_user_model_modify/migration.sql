/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `RestrictedUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RestrictedUser_email_key" ON "RestrictedUser"("email");
