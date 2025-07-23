import { PaymentMethod } from "@prisma/client";
import { decrypt, encrypt } from "../../../helpers/encryption";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";

const addPaymentMethod = async (data: PaymentMethod) => {
  const { type, marchentId } = data;

  // 🔍 Check if this type already exists for the merchant
  const existing = await prisma.paymentMethod.findFirst({
    where: {
      marchentId,
      type,
      isDeleted: false,
    },
  });

  if (existing) {
    throw new Error(`This merchant already has a ${type} payment method.`);
  }

  let payload: any = { ...data };

  // Handle different types
  switch (type) {
    case "BANK":
      payload.accountHolder = data.accountHolder;
      payload.accountNumber = data.accountNumber
        ? encrypt(data.accountNumber)
        : null;
      payload.bsbNumber = data.bsbNumber ? encrypt(data.bsbNumber) : null;
      break;

    case "PAYPAL":
      payload.email = data.email ? encrypt(data.email) : null;
      break;

    case "CARD":
      payload.accountHolder = data.accountHolder;
      payload.cardNumber = data.cardNumber ? encrypt(data.cardNumber) : null;
      payload.expiryDate = data.expiryDate ? encrypt(data.expiryDate) : null;
      payload.cvc = data.cvc ? encrypt(data.cvc) : null;
      break;

    default:
      throw new Error("Unsupported payment method type.");
  }

  const result = await prisma.paymentMethod.create({ data: payload });
  return result;
};

const decryptPaymentMethod = (method: PaymentMethod) => {
  const decrypted = { ...method };

  switch (method.type) {
    case "BANK":
      decrypted.accountNumber = method.accountNumber
        ? decrypt(method.accountNumber)
        : null;
      decrypted.bsbNumber = method.bsbNumber ? decrypt(method.bsbNumber) : null;
      break;

    case "PAYPAL":
      decrypted.email = method.email ? decrypt(method.email) : null;
      break;

    case "CARD":
      decrypted.cardNumber = method.cardNumber
        ? decrypt(method.cardNumber)
        : null;
      decrypted.expiryDate = method.expiryDate
        ? decrypt(method.expiryDate)
        : null;
      decrypted.cvc = method.cvc ? decrypt(method.cvc) : null;
      break;
  }

  return decrypted;
};

const getMyPaymentMethods = async (marchentId: string) => {
  const methods = await prisma.paymentMethod.findMany({
    where: {
      marchentId,
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return methods.map(decryptPaymentMethod);
};

const deletePaymentMethod = async (id: string, marchentId: string) => {
  const isExist = await prisma.paymentMethod.findFirst({
    where: {
      id,
      marchentId,
      isDeleted: false,
    },
  });

  if (!isExist) {
    throw new AppError(status.NOT_FOUND, "Payment Method not found !");
  }

  await prisma.paymentMethod.update({
    where: {
      id,
    },
    data: {
      isDeleted: true,
    },
  });
  return null;
};

export const paymentMethodService = {
  addPaymentMethod,
  getMyPaymentMethods,
  deletePaymentMethod
};
