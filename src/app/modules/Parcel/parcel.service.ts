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
let io: SocketIOServer;

export const initParcelService = (socket: SocketIOServer) => {
  io = socket;
};

const sendParcelToShipday = async (parcelData: any) => {
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

const addParcel = async (data: AddParcel & { addressId: string }) => {
  const prismaTransaction = await prisma.$transaction(async (prisma) => {
    // Step 1: Fetch Customer
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        marchentId: data.marchentId,
      },
    });

    if (!customer) {
      throw new AppError(status.NOT_FOUND, "Customer not found!");
    }

    // Step 2: Fetch Address
    const address = await prisma.address.findFirst({
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

    // Step 6: Get Pickup Location
    const pickupLocation = await getLocationByPostalCode(address.postalCode);
    const formattedPickupLocation = `${pickupLocation?.postalCode} ${pickupLocation?.placeName}, ${pickupLocation?.state}, ${pickupLocation?.country}`;

    // Step 7: Get Delivery Location
    const deliverLocation = await getLocationByPostalCode(customer.postalCode);
    const formattedDeliverLocation = `${deliverLocation?.postalCode} ${deliverLocation?.placeName}, ${deliverLocation?.state}, ${deliverLocation?.country}`;

    // Step 8: Create Parcel Record
    const result = await prisma.addParcel.create({
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

    // Step 9: Prepare Data for Shipday
    const parcelData = {
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

    // Step 10: Call Shipday API
    const shipdayResponse = await sendParcelToShipday(parcelData);

    // Step 11: Create Notification
    const notification = await prisma.notification.create({
      data: {
        title: `New parcel from ${data.marchentId}`,
        parcelId: result.id,
      },
    });

    // Step 12: Emit Notification
    io.emit("new-notification", notification);

    return result;
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

  const total = await prisma.addParcel.count({
    where: {
      marchentId,
      isDeleted: false,
      ...whereConditions,
    },
  });

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

// ----------------------------------
// MAIN FUNCTION: Parcel Status চেঞ্জ করা
// ----------------------------------
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

  // Step 8: Update the parcel with the new delivery status
  const updatedParcel = await prisma.addParcel.update({
    where: { id },
    data: {
      deliveryStatus: newDeliveryStatus,
      status: updatedParcelStatus, // Update Parcel Status based on DeliveryStatus
    },
  });

  const shipdayResponse = await axios.put(
    `https://api.shipday.com/order/edit/${updatedParcel.id}`,
    {
      orderId: updatedParcel.id,
      deliveryStatus: newDeliveryStatus,
      orderState: updatedParcel.status,
    },
    {
      headers: {
        Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, // Use the correct authorization method
        Accept: "application/json",
      },
    }
  );

  console.log(shipdayResponse);

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
