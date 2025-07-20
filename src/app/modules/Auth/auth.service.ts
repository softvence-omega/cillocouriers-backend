import { User, USER_ROLE, UserStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import bcrypt from "bcrypt";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import AppError from "../../Errors/AppError";
import status from "http-status";

const createUser = async (payload: User) => {
  // console.log(payload);

  const isUserExist = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  // console.log(isUserExist);

  if (isUserExist) {
    throw new AppError(status.CONFLICT, "User Already Exist");
  }

  const hashPassword = await bcrypt.hash(payload.password, 12);
  // console.log(hashPassword);

  const userData = {
    ...payload,
    role: USER_ROLE.marchant, 
    password: hashPassword,
  };


  const result = await prisma.user.create({
    data: {
      ...userData,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
  return result;


};
const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });
  if (!userData) {
    throw new Error("User not found..");
  }
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  // console.log(isCorrectPassword);

  if (!isCorrectPassword) {
    throw new AppError(status.UNAUTHORIZED, "Your password is incorrect.");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      email: userData.email,
      role: userData.role,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );
  return {
    accessToken,
    refreshToken,
  };
};

export const UserService = {
  createUser,
  loginUser,
};
