import { AddParcel, DeliveryStatus, ParcelStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { ParcelSearchableFields } from "../../constants/searchableFieldConstant";
import { Server as SocketIOServer } from "socket.io";
import { generateUniqueTrackingId } from "../../../helpers/generateUniqueTrackingId";
import { getLocationByPostalCode } from "../../../helpers/getLocationByPostalCode";
import calculateParcelPrice from "../../../helpers/calculateParcelPrice";
import axios from "axios";
import { getFormattedLocation } from "../../../helpers/getFormattedLocation";
import Stripe from "stripe";
import config from "../../../config";
import {
  TParcelData,
  TPaymentData,
  TShipdayParcelData,
} from "../../../types/parcel";
import { startOfDay, endOfDay } from "date-fns";

let io: SocketIOServer;
export const stripe = new Stripe(config.stripe_secret_key as string);
export const initParcelService = (socket: SocketIOServer) => {
  io = socket;
};

const createStripeCheckoutSession = async (
  paymentData: TPaymentData,
  parcelData: TShipdayParcelData,
  // shippoData: any,
  marchentId: string
) => {
  const { email, amount, parcelId } = paymentData;
  const existingCustomer = await stripe.customers.list({ email, limit: 1 });
  const customer =
    existingCustomer.data[0] || (await stripe.customers.create({ email }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer: customer.id,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amount * 100,
          product_data: { name: "Courier Service Payment" },
        },
        quantity: 1,
      },
    ],
    metadata: {
      parcelId: parcelId.toString(),
      email,
      amount: amount.toString(),
      parcelData: JSON.stringify(parcelData),
      // shippoData: JSON.stringify(shippoData),
      marchentId,
    },
    success_url: `http://localhost:3000/success`,
    cancel_url: `http://localhost:3000/cancel`,
  });

  return session.url;
};

export const sendParcelToShipday = async (parcelData: any) => {
  console.log({ parcelData });
  try {
    // Send the data to Shipday API
    const response = await axios.post(
      "https://dispatch.shipday.com/orders", // Correct API endpoint

      {
        orderNumber: parcelData.orderNumber,
        customerName: parcelData.customerName,
        customerAddress: parcelData.customerAddress,
        customerEmail: parcelData.customerEmail,
        customerPhoneNumber: parcelData.customerPhoneNumber,
        restaurantName: parcelData.restaurantName,
        restaurantAddress: parcelData.restaurantAddress,
        restaurantPhoneNumber: parcelData.restaurantPhoneNumber,
        totalOrderCost: parcelData.totalOrderCost,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, // Your API key
        },
      }
    );

    return response.data; // Return the Shipday response
  } catch (error) {
    console.error("Error sending data to Shipday:", error);
  }
};

export const createShippoOrder = async (orderData: any) => {
  const shippoAPIUrl = "https://api.goshippo.com/orders/";

  try {
    // Step 1: Call the Shippo API to create the order
    const response = await axios.post(shippoAPIUrl, orderData, {
      headers: {
        Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("shippoResponse from service", response);
    // Step 2: If the Shippo API request is successful, store the order in Prisma
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Error creating order");
  }
};
export async function getShipdayOrder(orderNumber: string) {
  const url = `https://api.shipday.com/orders/${orderNumber}`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`,
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    // console.log(data);
    return data;
  } catch (err) {
    console.error("Error fetching order");
  }
}

const addParcel = async (data: AddParcel & { addressId: string }) => {
  const prismaTransaction = await prisma.$transaction(async (tx) => {
    // Step 1: Fetch Customer
    const customer = await tx.customer.findFirst({
      where: {
        id: data.customerId,
        marchentId: data.marchentId,
      },
    });

    if (!customer) {
      throw new AppError(status.NOT_FOUND, "Customer not found!");
    }

    // Step 2: Fetch Address
    const address = await tx.address.findFirst({
      where: {
        id: data.addressId,
        marchentId: data.marchentId,
      },
    });

    if (!address) {
      throw new AppError(status.NOT_FOUND, "Address not found!");
    }

    // Step 3: Fetch User (Restaurant)
    const user = await prisma.user.findFirst({
      where: {
        id: data.marchentId,
      },
    });

    if (!user) {
      throw new AppError(status.NOT_FOUND, "User not found!");
    }

    // Step 4: Calculate Parcel Price
    const totalPrice = calculateParcelPrice(
      data.weight,
      data.length,
      data.width,
      data.height
    );

    // Step 5: Generate Tracking ID
    const trackingId = await generateUniqueTrackingId(7); // TRK-XXXXXXX

    const apiKey = process.env.GEOCODING_API_KEY as string; // Replace with your geocoding API key
    const countryCode = "au"; // Optional: Default is 'au'

    // const pickupLocation = await getLocationByPostalCode(address.postalCode);

    // Step 6: Get Pickup Location
    const pickupLocation = await getLocationByPostalCode(
      address.postalCode,
      countryCode,
      apiKey
    );

    // console.log({ pickupLocation });
    const formattedPickupLocation = pickupLocation;

    // Step 7: Get Delivery Location
    const deliverLocation = await getLocationByPostalCode(
      customer.postalCode,
      countryCode,
      apiKey
    );

    // console.log({ deliverLocation });
    const formattedDeliverLocation = deliverLocation;
    // Step 8: Create Parcel Record
    const result = await tx.addParcel.create({
      data: {
        marchentId: data.marchentId,
        customerId: data.customerId,
        addressId: data.addressId,
        type: data.type,
        name: data.name,
        weight: data.weight,
        length: data.length,
        width: data.width,
        height: data.height,
        description: data.description,
        trackingId: trackingId,
        amount: totalPrice,
      },
    });

    // Prepare Data for Shipday
    const parcelData: TShipdayParcelData = {
      orderNumber: result.id,
      customerName: customer.Name,
      customerAddress: formattedPickupLocation,
      customerEmail: customer.Email,
      customerPhoneNumber: customer.Phone,
      restaurantName: user?.businessName || "Default Restaurant Name",
      restaurantAddress: formattedDeliverLocation,
      restaurantPhoneNumber: user?.phone || "1234567890",
      totalOrderCost: totalPrice,
    };

    const location = await getFormattedLocation(
      customer.postalCode,
      "au",
      process.env.GEOCODING_API_KEY as string
    );

    // console.log({location});

    const shippoData = {
      to_address: {
        name: customer.Name,
        street1: location?.street,
        city: location?.city,
        state: location?.state,
        zip: location?.postalCode,
        country: "AU",
        email: customer.Email,
        phone: customer.Phone,
        company: user?.businessName,
      },
      line_items: [
        {
          quantity: 1,
          sku: result.trackingId,
          title: data.name,
          total_price: totalPrice.toFixed(2),
          currency: "AUD",
          weight: data?.weight,
          weight_unit: "kg",
        },
      ],
      placed_at: new Date().toISOString(),
      order_number: `#${result.id}`,
      order_status: "PAID",
      shipping_cost: totalPrice.toFixed(2),
      shipping_cost_currency: "AUD",
      shipping_method: "Standard Delivery",
      subtotal_price: totalPrice.toFixed(2),
      total_price: (totalPrice + parseFloat(totalPrice.toFixed(2))).toFixed(2),
      total_tax: "0.00",
      currency: "AUD",
      weight: parseFloat(data?.weight),
      weight_unit: "kg",
    };

    await prisma.shippoOrder.create({
      data: {
        // Flatten to_address
        to_name: shippoData.to_address.name,
        to_street1: "",
        to_city: shippoData.to_address.city!,
        to_state: shippoData.to_address.state!,
        to_zip: shippoData.to_address.zip!,
        to_country: shippoData.to_address.country,
        to_email: shippoData.to_address.email,
        to_phone: shippoData.to_address.phone,
        to_company: shippoData.to_address.company ?? "",

        // Order fields
        placed_at: new Date(shippoData.placed_at),
        order_number: shippoData.order_number,
        order_status: shippoData.order_status,
        shipping_cost: shippoData.shipping_cost,
        shipping_cost_currency: shippoData.shipping_cost_currency,
        shipping_method: shippoData.shipping_method,
        subtotal_price: shippoData.subtotal_price,
        total_price: shippoData.total_price,
        total_tax: shippoData.total_tax,
        currency: shippoData.currency,
        total_weight: shippoData.weight,
        weight_unit: shippoData.weight_unit,

        // Related line items
        line_items: {
          create: shippoData.line_items.map((item) => ({
            quantity: item.quantity,
            sku: item.sku ?? "",
            title: item.title,
            total_price: item.total_price,
            currency: item.currency,
            weight:
              typeof item.weight === "string"
                ? parseFloat(item.weight)
                : item.weight,
            weight_unit: item.weight_unit,
          })),
        },
      },
    });

    // const shippoData = {
    //   to_address: {
    //     city: location?.city,
    //     company: user?.businessName,
    //     country: "AU",
    //     email: customer.Email,
    //     name: customer.Name,
    //     phone: customer.Phone,
    //     state: location?.state,
    //     street1: location?.street,

    //     zip: location?.postalCode,
    //   },
    //   line_items: [
    //     {
    //       quantity: 1,
    //       sku: result.trackingId,
    //       title: data.name,
    //       // total_price: totalPrice.toFixed(2),
    //       // currency: "AUD",
    //       weight: data?.weight,
    //       weight_unit: "kg",
    //     },
    //   ],
    //   placed_at: new Date().toISOString(),
    //   order_number: `#${result.id}`,
    //   order_status: "PAID",
    //   shipping_cost: totalPrice.toFixed(2),
    //   // shipping_cost_currency: "AUD",
    //   // shipping_method: "Standard Delivery",
    //   // subtotal_price: totalPrice.toFixed(2),
    //   // total_price: (totalPrice + parseFloat(totalPrice.toFixed(2))).toFixed(
    //   //   2
    //   // ),
    //   // total_tax: "0.00",
    //   currency: "AUD",
    //   weight: data?.weight,
    //   weight_unit: "kg",
    // };

    const paymentData = {
      email: user?.email,
      amount: totalPrice,
      parcelId: result.id,
    };

    // console.log({paymentData})

    const response = await createStripeCheckoutSession(
      paymentData,
      parcelData,
      // shippoData,
      user?.id
    );
    console.log({ response });

    return { paymentUrl: response };
  });

  return prismaTransaction;
};

const getAllParcels = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(options, ParcelSearchableFields);

  const [result, total] = await Promise.all([
    prisma.addParcel.findMany({
      where: {
        isDeleted: false,
        ...whereConditions,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: {
          select: {
            name: true,
            businessName: true,
            address_Pickup_Location: true,
            phone: true,
            email: true,
            role: true,
            status: true,
          },
        },
        customar: true,
        address: true,
      },
    }),
    prisma.addParcel.count({
      where: {
        isDeleted: false,
        ...whereConditions,
      },
    }),
  ]);

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return {
    data: result,
    meta,
  };
};

const myParcels = async (marchentId: string, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(options, ParcelSearchableFields);

  // Main query total count
  const total = await prisma.addParcel.count({
    where: {
      marchentId,
      isDeleted: false,
      ...whereConditions,
    },
  });

  // Result data
  const result = await prisma.addParcel.findMany({
    where: {
      marchentId,
      isDeleted: false,
      ...whereConditions,
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      customar: true,
      address: true,
    },
  });

  // Card Data calculations
  const [totalPending, todayPending, totalDelivered, todayDelivered] =
    await Promise.all([
      prisma.addParcel.count({
        where: {
          marchentId,
          isDeleted: false,
          deliveryStatus: "PENDING",
        },
      }),
      prisma.addParcel.count({
        where: {
          marchentId,
          isDeleted: false,
          deliveryStatus: "PENDING",
          createdAt: {
            gte: startOfDay(new Date()),
            lte: endOfDay(new Date()),
          },
        },
      }),
      prisma.addParcel.count({
        where: {
          marchentId,
          isDeleted: false,
          deliveryStatus: "DELIVERED",
        },
      }),
      prisma.addParcel.count({
        where: {
          marchentId,
          isDeleted: false,
          deliveryStatus: "DELIVERED",
          createdAt: {
            gte: startOfDay(new Date()),
            lte: endOfDay(new Date()),
          },
        },
      }),
    ]);

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  const cardData = {
    totalPending,
    todayPending,
    totalDelivered,
    todayDelivered,
  };

  return {
    data: result,
    meta,
    cardData,
  };
};

const getSingleParcel = async (id: string) => {
  try {
    // First, fetch the parcel details from Shipday API
    const shipdayResponse = await axios.get(
      `https://api.shipday.com/orders/${id}`,
      {
        headers: {
          Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, // Use the correct authorization method
          Accept: "application/json",
        },
      }
    );

    // Now fetch the parcel data from the Prisma database
    const result = await prisma.addParcel.findFirst({
      where: {
        id,
        isDeleted: false, // Only get parcels that are not deleted
      },
      include: {
        customar: true,
        address: true,
      },
    });

    // If no parcel is found in the database
    if (!result) {
      throw new AppError(status.NOT_FOUND, "Parcel Not Found!");
    }

    // Return both the Shipday API response and the database parcel data
    return [
      {
        shipdayOrderResponse: shipdayResponse.data[0], // Assuming the Shipday API returns an array, and we need the first element
        databaseResponse: result, // Parcel data from the Prisma database
      },
    ];
  } catch (error: any) {
    console.error(
      "Error fetching Shipday orders:",
      error.response?.data || error.message
    );
    throw new Error(
      "Failed to fetch parcel data from Shipday and the database"
    );
  }
};

const deleteParcel = async (id: string, marchentId: string) => {
  const parcel = await prisma.addParcel.findFirst({
    where: {
      id,
      marchentId,
      isDeleted: false,
    },
    include: {
      customar: true,
      address: true,
    },
  });

  if (!parcel) {
    throw new AppError(status.NOT_FOUND, "Parcel Not Found!");
  }

  await prisma.addParcel.update({
    where: {
      id: id,
    },
    data: { isDeleted: true },
  });
  return null;
};

const VALID_STATUSES = [
  "ACTIVE",
  "NOT_ASSIGNED",
  "NOT_ACCEPTED",
  "NOT_STARTED_YET",
  "STARTED",
  "PICKED_UP",
  "READY_TO_DELIVER",
  "ALREADY_DELIVERED",
  "FAILED_DELIVERY",
  "INCOMPLETE",
];

const updateShipdayStatus = async (orderId: string, status: string) => {
  // Ensure status is valid
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(400, `Invalid Shipday status: ${status}`);
  }

  try {
    const response = await axios.put(
      `https://api.shipday.com/orders/${orderId}/status`,
      { status }, // Only status is needed
      {
        headers: {
          Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, // Must be valid
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    // console.log("✅ Shipday Sync Success:", response.data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("❌ Shipday Sync Failed:", error.response.data);
      console.error("Status Code:", error.response.status);
    } else {
      console.error("❌ Network or unknown error:", error.message);
    }

    throw new AppError(500, "Shipday sync failed.");
  }
};

const getOrderId = async (id: string) => {
  try {
    const url = `https://api.shipday.com/orders/${id}`;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`,
      },
    };

    const res = await fetch(url, options);
    const json = await res.json();
    return json[0].orderId;
  } catch (err) {
    console.error(err);
  }
};

const DeliveryStatusOrder: Record<DeliveryStatus, number> = {
  PENDING: 1, // Initial state, parcel has not been processed
  AWAITING_PICKUP: 2, // Parcel is waiting for pickup
  IN_TRANSIT: 3, // Parcel is on the way
  INCOMPLETE: 4, // Parcel delivery was not fully completed (e.g., partially delivered or delayed)
  DELIVERED: 5, // Parcel has been successfully delivered
  NOT_DELIVERED: 6, // Parcel could not be delivered (final status)
};

// ----------------------------------
// STATUS MAPPING:
// কোন deliveryStatus দিলে parcel.status কী হবে
// ----------------------------------
const DeliveryToParcelStatusMap: Partial<Record<DeliveryStatus, ParcelStatus>> =
  {
    PENDING: ParcelStatus.PENDING, // PENDING → PENDING (not yet processed)
    AWAITING_PICKUP: ParcelStatus.ACTIVE, // AWAITING_PICKUP → ACTIVE (waiting to be picked up)
    IN_TRANSIT: ParcelStatus.STARTED, // IN_TRANSIT → STARTED (on the way)
    DELIVERED: ParcelStatus.ALREADY_DELIVERED, // DELIVERED → ALREADY_DELIVERED (successfully delivered)
    NOT_DELIVERED: ParcelStatus.FAILED_DELIVERY, // NOT_DELIVERED → FAILED_DELIVERY (could not be delivered)
    INCOMPLETE: ParcelStatus.INCOMPLETE, // INCOMPLETE → INCOMPLETE (parcel delivery was not fully completed)
  };

const changeParcelStatus = async (
  id: string,
  data: { deliveryStatus: DeliveryStatus }
) => {
  // Step 1: Find parcel
  const parcel = await prisma.addParcel.findUnique({
    where: { id, isDeleted: false },
  });

  if (!parcel) {
    throw new AppError(404, "Parcel not found!");
  }

  const currentDeliveryStatus = parcel.deliveryStatus as DeliveryStatus;

  // Step 2: Prevent changes after DELIVERED
  if (currentDeliveryStatus === DeliveryStatus.DELIVERED) {
    throw new AppError(
      400,
      "Parcel is already delivered. Cannot change status."
    );
  }

  // Step 3: Validate and sanitize the new status
  const newDeliveryStatus = data.deliveryStatus.trim() as DeliveryStatus;

  // Step 4: Validate if the new status is a valid enum value
  if (!Object.values(DeliveryStatus).includes(newDeliveryStatus)) {
    throw new AppError(400, "Invalid delivery status!");
  }

  // Step 5: Prevent backward status change
  const currentOrder = DeliveryStatusOrder[currentDeliveryStatus];
  const nextOrder = DeliveryStatusOrder[newDeliveryStatus];

  if (nextOrder < currentOrder) {
    throw new AppError(
      400,
      `Cannot move from ${currentDeliveryStatus} to ${newDeliveryStatus}.`
    );
  }

  // Step 6: Prevent same status change
  if (nextOrder === currentOrder) {
    throw new AppError(
      400,
      `Parcel is already in ${newDeliveryStatus} status.`
    );
  }

  // Step 7: Map DeliveryStatus to ParcelStatus
  const updatedParcelStatus =
    DeliveryToParcelStatusMap[newDeliveryStatus] ?? parcel.status;

  // console.log({ updatedParcelStatus });

  // Step 8: Update the parcel with the new delivery status
  const updatedParcel = await prisma.addParcel.update({
    where: { id },
    data: {
      deliveryStatus: newDeliveryStatus,
      status: updatedParcelStatus, // Update Parcel Status based on DeliveryStatus
    },
  });

  // Step 7: Sync with Shipday

  const orderId = await getOrderId(id); // ফাংশন কল করে result পেতে হবে
  // console.log({ orderId });

  await updateShipdayStatus(orderId, updatedParcelStatus);

  return updatedParcel;
};

export const ParcelService = {
  addParcel,
  myParcels,
  getSingleParcel,
  deleteParcel,
  getAllParcels,
  changeParcelStatus,
};
