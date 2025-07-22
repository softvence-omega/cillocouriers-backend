import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { paymentMethodController } from "./paymentMethod.controller";
const router = express.Router();

router.get("/my-payment-methods",  RoleValidation(USER_ROLE.marchant),paymentMethodController.getMyPaymentMethods);

router.post(
  "/add-payment-method",
  RoleValidation(USER_ROLE.marchant),
  paymentMethodController.addPaymentMethod
);

export const PaymentMethodRoute = router;
