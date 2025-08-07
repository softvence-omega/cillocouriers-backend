-- CreateTable
CREATE TABLE "ShippoOrder" (
    "id" TEXT NOT NULL,
    "to_name" TEXT NOT NULL,
    "to_street1" TEXT NOT NULL,
    "to_city" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "to_zip" TEXT NOT NULL,
    "to_country" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "to_phone" TEXT NOT NULL,
    "to_company" TEXT,
    "placed_at" TIMESTAMP(3) NOT NULL,
    "order_number" TEXT NOT NULL,
    "order_status" TEXT NOT NULL,
    "shipping_cost" TEXT NOT NULL,
    "shipping_cost_currency" TEXT NOT NULL,
    "shipping_method" TEXT NOT NULL,
    "subtotal_price" TEXT NOT NULL,
    "total_price" TEXT NOT NULL,
    "total_tax" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "total_weight" DOUBLE PRECISION NOT NULL,
    "weight_unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippoOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippoLineItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "total_price" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "weight_unit" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippoLineItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ShippoLineItem" ADD CONSTRAINT "ShippoLineItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShippoOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
