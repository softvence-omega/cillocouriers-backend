import { RestrictedUser } from "@prisma/client";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { RestrictedUserSearchableFields } from "../../constants/searchableFieldConstant";

const addRestrictedUser = async (data: RestrictedUser) => {
  //   console.log("create restricted user...", data);

  const isRestrictedUserExists = await prisma.restrictedUser.findFirst({
    where: {
      email: data.email,
      marchentId: data.marchentId,
    },
  });

  if (isRestrictedUserExists) {
    throw new AppError(
      status.CONFLICT,
      `Restricted user already exists with this email ${data.email}`
    );
  }

  const result = await prisma.restrictedUser.create({
    data,
  });

  return result;
};

const getAllRestrictedUser = async (marchentId: string, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(
    options,
    RestrictedUserSearchableFields
  );

  const total = await prisma.restrictedUser.count({
    where: {
      marchentId,
      isDeleted: false,
      ...whereConditions,
    },
  });

  const result = await prisma.restrictedUser.findMany({
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

const getSingleRestrictedUser = async (id: string, marchentId: string) => {
  const result = await prisma.restrictedUser.findFirst({
    where: {
      id,
      marchentId,
      isDeleted: false,
    },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Restricted user not found!");
  }

  return result;
};

const deleteRestrictedUser = async (id: string, marchentId: string) => {
  const isRestrictedUserExists = await prisma.restrictedUser.findFirst({
    where: {
      id,
      marchentId,
      isDeleted: false,
    },
  });

  if (!isRestrictedUserExists) {
    throw new AppError(status.NOT_FOUND, "Restricted user not found!");
  }
  await prisma.restrictedUser.update({
    where: {
      id,
    },
    data: {
      isDeleted: true,
    },
  });
};

export const RestrictedUserService = {
  addRestrictedUser,
  getAllRestrictedUser,
  getSingleRestrictedUser,
  deleteRestrictedUser
};
