import { UserRole, UserStatus } from "@prisma/client";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import { UserSearchableFields } from "../../constants/searchableFieldConstant";
import AppError from "../../Errors/AppError";
import status from "http-status";

const getAllUsers = async (params: any, options: any) => {
  const { limit, skip } = paginationHelper.calculatePagination(options);

  let andConditions: any[] = [];

  // Search Term filter
  if (params.searchTerm?.trim()) {
    andConditions.push({
      OR: UserSearchableFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (options.role === "USER") {
    andConditions.push({ role: UserRole.USER });
  } else if (options.role === "ADMIN") {
    andConditions.push({ role: UserRole.ADMIN });
  } else {
    andConditions = andConditions.filter((condition) => !("role" in condition));
  }

  if (options.status === "ACTIVE") {
    andConditions.push({ status: UserStatus.ACTIVE });
  } else if (options.status === "BLOCKED") {
    andConditions.push({ status: UserStatus.BLOCKED });
  } else {
    andConditions = andConditions.filter(
      (condition) => !("status" in condition)
    );
  }

  const whereConditions = { AND: andConditions };
  // console.log("get.....");
  const result = prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileUrl: true,
    },
  });
  return result;
};

const myProfileInfo = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      reviews: true,
      comments: true,
      votes: true,
      payments: true,
      Discount: true,
    },
  });


  return result;
};

const makeUserToAdmin = async (id: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      role: UserRole.ADMIN,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileUrl: true,
    },
  });
  return result;
};
const makeAdminToUser = async (id: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      role: UserRole.USER,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileUrl: true,
    },
  });
  return result;
};
const blockUser = async (id: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      status: UserStatus.BLOCKED,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileUrl: true,
    },
  });
  return result;
};
const makeActive = async (id: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileUrl: true,
    },
  });
  return result;
};
const deleteUser = async (id: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }

  const result = await prisma.user.delete({
    where: {
      id,
    },
  });
  return result;
};

export const UserDataServices = {
  getAllUsers,
  makeUserToAdmin,
  makeAdminToUser,
  blockUser,
  makeActive,
  deleteUser,
  myProfileInfo,
};
