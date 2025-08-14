import { AddParcel, ParcelStatus, PaymentStatus } from "@prisma/client";
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
import { TPaymentData, TShipdayParcelData } from "../../../types/parcel";
import { startOfDay, endOfDay } from "date-fns";
import { Request } from "express";

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
    const user = await tx.user.findFirst({
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

    // Step 6: Get Pickup Location
    const pickupLocation = await getLocationByPostalCode(
      address.postalCode,
      countryCode,
      apiKey
    );

    const formattedPickupLocation = pickupLocation;

    // Step 7: Get Delivery Location
    const deliverLocation = await getLocationByPostalCode(
      customer.postalCode,
      countryCode,
      apiKey
    );

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

    await tx.shippoOrder.create({
      data: {
        to_name: shippoData.to_address.name,
        to_street1: "",
        to_city: shippoData.to_address.city as string,
        to_state: shippoData.to_address.state as string,
        to_zip: shippoData.to_address.zip as string,
        to_country: shippoData.to_address.country,
        to_email: shippoData.to_address.email,
        to_phone: shippoData.to_address.phone,
        to_company: shippoData.to_address.company ?? "",
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

    const paymentData = {
      email: user?.email,
      amount: totalPrice,
      parcelId: result.id,
    };

    const response = await createStripeCheckoutSession(
      paymentData,
      parcelData,
      user?.id
    );

    return { paymentUrl: response };
  });

  return prismaTransaction;
};

// const getAllParcels = async (options: any) => {
//   const { page, limit, skip, sortBy, sortOrder } =
//     paginationHelper.calculatePagination(options);

//   const whereConditions = buildDynamicFilters(options, ParcelSearchableFields);

//   const [
//     result,
//     total,
//     totalPending,
//     todayPending,
//     totalDelivered,
//     todayDelivered,
//   ] = await Promise.all([
//     // Main data
//     prisma.addParcel.findMany({
//       where: {
//         isDeleted: false,
//         ...whereConditions,
//       },
//       skip,
//       take: limit,
//       orderBy: {
//         [sortBy]: sortOrder,
//       },
//       include: {
//         user: {
//           select: {
//             name: true,
//             businessName: true,
//             address_Pickup_Location: true,
//             phone: true,
//             email: true,
//             role: true,
//             status: true,
//           },
//         },
//         customar: true,
//         address: true,
//       },
//     }),

//     // Total count
//     prisma.addParcel.count({
//       where: {
//         isDeleted: false,
//         ...whereConditions,
//       },
//     }),

//     // Total pending
//     prisma.addParcel.count({
//       where: {
//         isDeleted: false,
//         status: "PENDING",
//       },
//     }),

//     // Today pending
//     prisma.addParcel.count({
//       where: {
//         isDeleted: false,
//         status: "PENDING",
//         createdAt: {
//           gte: startOfDay(new Date()),
//           lte: endOfDay(new Date()),
//         },
//       },
//     }),

//     // Total delivered
//     prisma.addParcel.count({
//       where: {
//         isDeleted: false,
//         status: "COMPLETE",
//       },
//     }),

//     // Today delivered
//     prisma.addParcel.count({
//       where: {
//         isDeleted: false,
//         status: "COMPLETE",
//         createdAt: {
//           gte: startOfDay(new Date()),
//           lte: endOfDay(new Date()),
//         },
//       },
//     }),
//   ]);

//   const meta = {
//     page,
//     limit,
//     total,
//     totalPages: Math.ceil(total / limit),
//   };

//   const cardData = {
//     totalPending,
//     todayPending,
//     totalDelivered,
//     todayDelivered,
//   };

//   return {
//     data: result,
//     meta,
//     cardData,
//   };
// };


const getAllParcels = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(options, ParcelSearchableFields);

  const baseFilter = { isDeleted: false };

  const [
    result,
    total,
    totalPending,
    totalNotAssigned,
    todayNotAssigned,
    totalReadyToDeliver,
    todayReadyToDeliver,
  ] = await Promise.all([
    prisma.addParcel.findMany({
      where: { ...baseFilter, ...whereConditions , paymentStatus:PaymentStatus.PAID},
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
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
      where: { ...baseFilter, ...whereConditions },
    }),

    prisma.addParcel.count({
      where: { ...baseFilter, status: ParcelStatus.PENDING },
    }),

    prisma.addParcel.count({
      where: {
        ...baseFilter,
        status: ParcelStatus.NOT_ASSIGNED,
      },
    }),

    prisma.addParcel.count({
      where: {
        ...baseFilter,
        status: ParcelStatus.NOT_ASSIGNED,
        createdAt: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      },
    }),

    prisma.addParcel.count({
      where: { ...baseFilter, status: ParcelStatus.READY_TO_DELIVER },
    }),

    prisma.addParcel.count({
      where: {
        ...baseFilter,
        status: ParcelStatus.READY_TO_DELIVER,
        createdAt: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      },
    }),
  ]);

  return {
    data: result,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    cardData: {
      totalPending,
      totalNotAssigned,
      todayNotAssigned,
      totalReadyToDeliver,
      todayReadyToDeliver,
    },
  };
};



const myParcels = async (marchentId: string, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(options, ParcelSearchableFields);
  const baseFilter = { marchentId, isDeleted: false };

  // Main query total count
  const total = await prisma.addParcel.count({
    where: { ...baseFilter, ...whereConditions ,paymentStatus:PaymentStatus.PAID},
  });

  // Result data
  const result = await prisma.addParcel.findMany({
    where: { ...baseFilter, ...whereConditions },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: { customar: true, address: true },
  });

  // Card Data calculations
  const [totalPending, totalNotAssigned, todayNotAssigned, totalReadyToDeliver, todayReadyToDeliver] =
    await Promise.all([
      prisma.addParcel.count({ where: { ...baseFilter, status: ParcelStatus.PENDING } }),
      prisma.addParcel.count({ where: { ...baseFilter, status: ParcelStatus.NOT_ASSIGNED } }),
      prisma.addParcel.count({
        where: {
          ...baseFilter,
          status: ParcelStatus.NOT_ASSIGNED,
          createdAt: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
        },
      }),
      prisma.addParcel.count({ where: { ...baseFilter, status: ParcelStatus.READY_TO_DELIVER } }),
      prisma.addParcel.count({
        where: {
          ...baseFilter,
          status: ParcelStatus.READY_TO_DELIVER,
          createdAt: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
        },
      }),
    ]);

  return {
    data: result,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    cardData: { totalPending, totalNotAssigned, todayNotAssigned, totalReadyToDeliver, todayReadyToDeliver },
  };
};


const getSingleParcel = async (id: string) => {
  try {
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
    return result;
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

// const VALID_STATUSES = [
//   "ACTIVE",
//   "NOT_ASSIGNED",
//   "NOT_ACCEPTED",
//   "NOT_STARTED_YET",
//   "STARTED",
//   "PICKED_UP",
//   "READY_TO_DELIVER",
//   "ALREADY_DELIVERED",
//   "FAILED_DELIVERY",
//   "INCOMPLETE",
// ];

// const updateShipdayStatus = async (orderId: string, status: string) => {
//   // Ensure status is valid
//   if (!VALID_STATUSES.includes(status)) {
//     throw new AppError(400, `Invalid Shipday status: ${status}`);
//   }

//   try {
//     const response = await axios.put(
//       `https://api.shipday.com/orders/${orderId}/status`,
//       { status }, // Only status is needed
//       {
//         headers: {
//           Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, // Must be valid
//           Accept: "application/json",
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // console.log("✅ Shipday Sync Success:", response.data);
//     return response.data;
//   } catch (error: any) {
//     if (error.response) {
//       console.error("❌ Shipday Sync Failed:", error.response.data);
//       console.error("Status Code:", error.response.status);
//     } else {
//       console.error("❌ Network or unknown error:", error.message);
//     }

//     throw new AppError(500, "Shipday sync failed.");
//   }
// };

// const getOrderId = async (id: string) => {
//   try {
//     const url = `https://api.shipday.com/orders/${id}`;
//     const options = {
//       method: "GET",
//       headers: {
//         accept: "application/json",
//         Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`,
//       },
//     };

//     const res = await fetch(url, options);
//     const json = await res.json();
//     return json[0].orderId;
//   } catch (err) {
//     console.error(err);
//   }
// };

// export const processShipdayWebhook = async (req: Request) => {
//   const tokenFromHeader = req.headers["token"];
//   const expectedToken = process.env.SHIPDAY_WEBHOOK_TOKEN;

//   if (tokenFromHeader !== expectedToken) {
//     const error: any = new Error("Unauthorized");
//     error.statusCode = 401;
//     throw error;
//   }

//   const payload = req.body;
//   const shipdayOrderId = payload.order?.id;

//   if (!shipdayOrderId) {
//     const error: any = new Error("Missing Shipday order id in payload");
//     error.statusCode = 400;
//     throw error;
//   }

//   const parcel = await prisma.addParcel.findUnique({
//     where: { id: shipdayOrderId },
//   });

//   console.log(parcel, "parcel");

//   if (!parcel) {
//     const error: any = new Error(
//       `Parcel with Shipday orderId ${shipdayOrderId} not found`
//     );
//     error.statusCode = 404;
//     throw error;
//   }

//   const newParcelStatus = mapShipdayOrderStatusToParcelStatus(
//     payload.order_status
//   );

//   await prisma.addParcel.update({
//     where: { id: parcel.id },
//     data: {
//       status: newParcelStatus,
//     },
//   });
// };

// export const mapShipdayOrderStatusToParcelStatus = (
//   shipdayStatus: string
// ): ParcelStatus => {
//   switch (shipdayStatus) {
//     case "NOT_ASSIGNED":
//     case "NOT_ACCEPTED":
//     case "NOT_STARTED_YET":
//       return ParcelStatus.PENDING;

//     case "STARTED":
//       return ParcelStatus.STARTED;

//     case "PICKED_UP":
//     case "READY_TO_DELIVER":
//       return ParcelStatus.ACTIVE;

//     case "ALREADY_DELIVERED":
//       return ParcelStatus.ALREADY_DELIVERED;

//     case "FAILED_DELIVERY":
//       return ParcelStatus.FAILED_DELIVERY;

//     case "INCOMPLETE":
//       return ParcelStatus.INCOMPLETE;

//     default:
//       // Unknown status গুলোর জন্য default হিসেবে PENDING দাও
//       return ParcelStatus.PENDING;
//   }
// };

export const updateOrdersFromShipday = async () => {
  const url = "https://api.shipday.com/orders";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, // API key দিলে রাখো
    },
  };

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`Shipday API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // ধরছি Shipday response এ 'orders' নামে array আছে
    const orders = data;

    // console.log({orders});

    // console.log("Fetched orders:", orders.length);

    for (const order of orders) {
      const shipdayOrderId = order.orderId;
      const orderStatus = order.orderStatus.orderState;

      // console.log(order.orderStatus);

      // console.log({orderStatus});

      const parcel = await prisma.addParcel.findFirst({
        where: {
          shipdayOrderId: shipdayOrderId,
        },
      });

      //  console.log(parcel,"parcel");

      if (parcel) {
        // const newParcelStatus = mapShipdayOrderStatusToParcelStatus(orderStatus);
        // console.log(newParcelStatus);

        await prisma.addParcel.update({
          where: { id: parcel.id },
          data: { status: orderStatus },
        });
      }
    }
  } catch (error) {
    console.error("Error fetching Shipday orders:", error);
  }
};

const calcualteParcelPrice = async (data: any) => {
  // console.log("calculate price....", data);
  // Step 4: Calculate Parcel Price
  const totalPrice = calculateParcelPrice(
    data.weight_kg,
    data.length_cm,
    data.width_cm,
    data.height_cm
  );

  // console.log(totalPrice, "total price");
  const apiKey = process.env.GEOCODING_API_KEY as string; // Replace with your geocoding API key
  const countryCode = "au"; // Optional: Default is 'au'

  const pickupLocation = await getLocationByPostalCode(
    data.postcodes.from,
    countryCode,
    apiKey
  );
  // console.log(pickupLocation,'pickup location');
  const deliveryLocation = await getLocationByPostalCode(
    data.postcodes.to,
    countryCode,
    apiKey
  );

  // console.log(deliveryLocation,'delivery location...');

  return {
    totalPrice,
    pickupLocation,
    deliveryLocation,
  };
};

export const ParcelService = {
  addParcel,
  myParcels,
  getSingleParcel,
  deleteParcel,
  getAllParcels,
  // changeParcelStatus,
  calcualteParcelPrice,
};
