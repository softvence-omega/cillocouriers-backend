-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "USER_ROLE" AS ENUM ('admin', 'marchant');

-- CreateEnum
CREATE TYPE "RESTRICTED_USER_ROLE" AS ENUM ('dispatch', 'account', 'warehouse');

-- CreateEnum
CREATE TYPE "ParcelType" AS ENUM ('REGULAR', 'EXPRESS');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'AWAITING_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'NOT_DELIVERED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "address_Pickup_Location" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "USER_ROLE" NOT NULL,
    "password" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "marchentId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaypalAccount" (
    "id" TEXT NOT NULL,
    "marchentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PaypalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardPayment" (
    "id" TEXT NOT NULL,
    "marchentId" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "cvc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CardPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "marchentId" TEXT NOT NULL,
    "addressName" TEXT NOT NULL,
    "streetName" TEXT NOT NULL,
    "cityOrSuburb" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "marchentId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Phone" TEXT NOT NULL,
    "ShippingAddress" TEXT NOT NULL,
    "BillingAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddParcel" (
    "id" TEXT NOT NULL,
    "marchentId" TEXT NOT NULL,
    "type" "ParcelType" NOT NULL,
    "name" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "invoice" TEXT,
    "notes" TEXT,
    "pickupDate" TIMESTAMP(3),
    "trackingId" TEXT,
    "status" "ParcelStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AddParcel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestrictedUser" (
    "id" TEXT NOT NULL,
    "marchentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "RESTRICTED_USER_ROLE" NOT NULL,
    "placeOrders" BOOLEAN NOT NULL,
    "accessSavedAddress" BOOLEAN NOT NULL,
    "useDefaultAddress" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RestrictedUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_marchentId_key" ON "BankAccount"("marchentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaypalAccount_marchentId_key" ON "PaypalAccount"("marchentId");

-- CreateIndex
CREATE UNIQUE INDEX "CardPayment_marchentId_key" ON "CardPayment"("marchentId");

-- CreateIndex
CREATE UNIQUE INDEX "AddParcel_trackingId_key" ON "AddParcel"("trackingId");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_marchentId_fkey" FOREIGN KEY ("marchentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaypalAccount" ADD CONSTRAINT "PaypalAccount_marchentId_fkey" FOREIGN KEY ("marchentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardPayment" ADD CONSTRAINT "CardPayment_marchentId_fkey" FOREIGN KEY ("marchentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_marchentId_fkey" FOREIGN KEY ("marchentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_marchentId_fkey" FOREIGN KEY ("marchentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddParcel" ADD CONSTRAINT "AddParcel_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddParcel" ADD CONSTRAINT "AddParcel_marchentId_fkey" FOREIGN KEY ("marchentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddParcel" ADD CONSTRAINT "AddParcel_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestrictedUser" ADD CONSTRAINT "RestrictedUser_marchentId_fkey" FOREIGN KEY ("marchentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
