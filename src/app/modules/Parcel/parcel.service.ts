import { AddParcel } from "@prisma/client";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { generateUniqueTrackingId } from "../../../helpers/generateUniqueTrackingId";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { ParcelSearchableFields } from "../../constants/searchableFieldConstant";

const addParcel = async (data: AddParcel & { addressId: string }) => {
  // 1. কাস্টমার আছে কিনা চেক
  const customer = await prisma.customer.findFirst({
    where: {
      id: data.customerId,
      marchentId: data.marchentId,
    },
  });

  if (!customer) {
    throw new AppError(status.NOT_FOUND, "Customer not found!");
  }

  // 2. অ্যাড্রেস আছে কিনা চেক
  const address = await prisma.address.findFirst({
    where: {
      id: data.addressId,
      marchentId: data.marchentId,
    },
  });

  if (!address) {
    throw new AppError(status.NOT_FOUND, "Address not found!");
  }

  // 3. zone বের করা (local or intercity)
  const pickupCity = address.cityOrSuburb.toLowerCase();
  const destination = customer.ShippingAddress.toLowerCase();
  const isLocal = destination.includes(pickupCity);
  const zone = isLocal ? "local" : "intercity";

  // 4. ওজন extract করা (e.g., "2kg" → 2)
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

  // 6. Tracking ID generate করা
  const trackingId = await generateUniqueTrackingId(7); // final: TRK-XXXXXXX

  // 7. Parcel তৈরি করা
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

  return result;
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
      address:true
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




export const ParcelService = {
  addParcel,
  myParcels,
};
