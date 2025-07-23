import { AddParcel, DeliveryStatus, ParcelStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { generateUniqueTrackingId } from "../../../helpers/generateUniqueTrackingId";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { ParcelSearchableFields } from "../../constants/searchableFieldConstant";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer; 

export const initParcelService = (socket: SocketIOServer) => {
  io = socket; 
};

const addParcel = async (data: AddParcel & { addressId: string }) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id: data.customerId,
      marchentId: data.marchentId,
    },
  });

  if (!customer) {
    throw new AppError(status.NOT_FOUND, "Customer not found!");
  }

  const address = await prisma.address.findFirst({
    where: {
      id: data.addressId,
      marchentId: data.marchentId,
    },
  });

  if (!address) {
    throw new AppError(status.NOT_FOUND, "Address not found!");
  }

  const pickupCity = address.cityOrSuburb.toLowerCase();
  const destination = customer.ShippingAddress.toLowerCase();
  const isLocal = destination.includes(pickupCity);
  const zone = isLocal ? "local" : "intercity";

  const extractWeight = (weightStr: string): number => {
    const match = weightStr.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 1;
  };

  const weight = extractWeight(data.weight);

  // 5. Price calculation
  const baseRate = 50;
  const zoneMultiplier = zone === "local" ? 1 : 1.5;
  const typeMultiplier = data.type === "EXPRESS" ? 1.5 : 1;
  const codCharge = 20;

  const basePrice = weight * baseRate;
  const totalPrice = Math.ceil(
    basePrice * zoneMultiplier * typeMultiplier + codCharge
  );

  // 6. Tracking ID generate 
  const trackingId = await generateUniqueTrackingId(7); // final: TRK-XXXXXXX

  const result = await prisma.addParcel.create({
    data: {
      marchentId: data.marchentId,
      customerId: data.customerId,
      addressId: data.addressId,
      type: data.type,
      name: data.name,
      weight: data.weight,
      description: data.description,
      trackingId: trackingId,
      amount: totalPrice,
    },
  });

    // 🔔 Create Notification
    const notification = await prisma.notification.create({
      data: {
        title: `New parcel from ${data.marchentId}`,
        parcelId: result.id,
      },
    });

    // 🔥 Emit real-time
    io.emit("new-notification", notification);
    console.log("📢 Notification emitted:", notification);


  return result;
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
  const result = await prisma.addParcel.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      customar: true,
      address: true,
    },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Parcel Not Found!");
  }

  return result;
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

// const changeParcelStatus = async (
//   id: string,
//   data: { deliveryStatus: ParcelDeliveryStatus } // তুমি enum ইউজ করছো ধরছি
// ) => {
//   // Step 1: Check if parcel exists
//   const parcel = await prisma.addParcel.findUnique({
//     where: { id, isDeleted: false },
//   });

//   if (!parcel) {
//     throw new AppError(404, "Parcel not found!");
//   }

//   // Step 2: Map deliveryStatus to status
//   let updatedStatus: ParcelStatus | undefined;

//   switch (data.deliveryStatus) {
//     case "AWAITING_PICKUP":
//       updatedStatus = "PROCESSING";
//       break;
//     case "DELIVERED":
//       updatedStatus = "COMPLETED";
//       break;
//     case "NOT_DELIVERED":
//       updatedStatus = "CANCELLED";
//       break;
//     default:
//       updatedStatus = parcel.status; // unchanged or optionally throw error
//   }

//   // Step 3: Update parcel
//   const updatedParcel = await prisma.addParcel.update({
//     where: { id },
//     data: {
//       deliveryStatus: data.deliveryStatus,
//       status: updatedStatus,
      
//     },
//   });

//   return updatedParcel;
// };



const DeliveryStatusOrder: Record<DeliveryStatus, number> = {
  PENDING: 1,
  AWAITING_PICKUP: 2,
  IN_TRANSIT: 3,
  DELIVERED: 4,
  NOT_DELIVERED: 5, // Final status
};

// ----------------------------------
// STATUS MAPPING:
// কোন deliveryStatus দিলে parcel.status কী হবে
// ----------------------------------

const DeliveryToParcelStatusMap: Partial<Record<DeliveryStatus, ParcelStatus>> = {
  AWAITING_PICKUP: ParcelStatus.PROCESSING,
  DELIVERED: ParcelStatus.COMPLETED,
  NOT_DELIVERED: ParcelStatus.CANCELLED,
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
  if (currentDeliveryStatus === "DELIVERED") {
    throw new AppError(400, "Parcel is already delivered. Cannot change status.");
  }

  // Step 3: Get & validate new status (sanitize)
  const newDeliveryStatus = data.deliveryStatus.trim() as DeliveryStatus;

  // Step 4: Validate enum value
  if (!Object.values(DeliveryStatus).includes(newDeliveryStatus)) {
    throw new AppError(400, "Invalid delivery status!");
  }

  const currentOrder = DeliveryStatusOrder[currentDeliveryStatus];
  const nextOrder = DeliveryStatusOrder[newDeliveryStatus];

  // Step 5: Prevent backward status change
  if (nextOrder < currentOrder) {
    throw new AppError(
      400,
      `Cannot move from ${currentDeliveryStatus} to ${newDeliveryStatus}`
    );
  }

  // Step 6: Prevent same status
  if (nextOrder === currentOrder) {
    throw new AppError(400, `Parcel is already in ${newDeliveryStatus} status`);
  }

  // Step 7: Determine ParcelStatus
  const updatedParcelStatus =
    DeliveryToParcelStatusMap[newDeliveryStatus] ?? parcel.status;

  // Step 8: Update parcel
  const updatedParcel = await prisma.addParcel.update({
    where: { id },
    data: {
      deliveryStatus: newDeliveryStatus,
      status: updatedParcelStatus,
    },
  });

  return updatedParcel;
};


export const ParcelService = {
  addParcel,
  myParcels,
  getSingleParcel,
  deleteParcel,
  getAllParcels,
  changeParcelStatus
};
