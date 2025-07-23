-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "parcelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "AddParcel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
