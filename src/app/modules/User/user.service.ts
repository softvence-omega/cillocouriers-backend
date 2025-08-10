import { User, USER_ROLE, UserStatus } from "@prisma/client";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import { UserSearchableFields } from "../../constants/searchableFieldConstant";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import bcrypt from "bcrypt";

const getAllUsers = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(options, UserSearchableFields);

  const total = await prisma.user.count({
    where: whereConditions,
  });

  const users = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder, // Dynamic sort field
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return {
    data: users,
    meta,
  };
};

const myProfileInfo = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      businessName: true,
      address_Pickup_Location: true,
      phone: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return result;
};

const changeRole = async (id: string, data: { role: USER_ROLE }) => {
  const result = await prisma.$transaction(async (tx) => {
    const isUserExist = await tx.user.findUnique({
      where: { id },
    });

    if (!isUserExist) {
      throw new AppError(status.NOT_FOUND, "User not found!");
    }

    if (isUserExist.role === data.role) {
      throw new AppError(status.BAD_REQUEST, "User already has this role!");
    }

    const updatedUser = await tx.user.update({
      where: { id: isUserExist.id },
      data: {
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        address_Pickup_Location: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return updatedUser;
  });

  return result;
};

const changeUserStatus = async (id: string, data: { status: UserStatus }) => {
  const result = await prisma.$transaction(async (tx) => {
    const isUserExist = await tx.user.findUnique({
      where: { id: id, isDeleted: false },
    });

    if (!isUserExist) {
      throw new AppError(status.NOT_FOUND, "User not found!");
    }

    if (isUserExist.status === data.status) {
      throw new AppError(status.BAD_REQUEST, "User already has this status!");
    }

    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        status: data.status,
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        address_Pickup_Location: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return updatedUser;
  });

  return result;
};

const deleteUser = async (id: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const isUserExist = await tx.user.findUnique({
      where: {
        id: id,
        isDeleted: false,
      },
    });

    // Optional: check if already deleted
    if (!isUserExist) {
      throw new AppError(status.NOT_FOUND, "User not found!");
    }

    const deletedUser = await tx.user.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });

    return null;
  });

  return result;
};

const updateProfile = async (id: string, payload: Partial<User>) => {
  try {
    const result = await prisma.user.update({
      where: { id },
      data: payload,
    });

    return result;
  } catch (error: any) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
};

/**
 * Change user password
 */
const changePassword = async (
  userId: string,
  data: { oldPassword: string; newPassword: string }
) => {
  return await prisma.$transaction(async (tx) => {
    // 1️⃣ Find the user
    const user = await tx.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { password: true },
    });

    if (!user) {
      throw new AppError(status.NOT_FOUND, "User not found");
    }

    // 2️⃣ Verify old password
    const isOldPasswordCorrect = await bcrypt.compare(
      data.oldPassword,
      user.password
    );

    if (!isOldPasswordCorrect) {
      throw new AppError(status.BAD_REQUEST, "Old password is incorrect");
    }

    // 3️⃣ Hash the new password
    const hashedNewPassword = await bcrypt.hash(data.newPassword, 12);

    // 4️⃣ Update the password
    await tx.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: "Password changed successfully" };
  });
};


export const UserDataServices = {
  getAllUsers,
  changeRole,
  changeUserStatus,
  deleteUser,
  myProfileInfo,
  updateProfile,
  changePassword
};
