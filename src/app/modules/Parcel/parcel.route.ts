import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { ParcelController } from "./parcel.controller";
const router = express.Router();

router.get(
  "/my-parcels",
  RoleValidation(USER_ROLE.marchant),
  ParcelController.myParcels
);

router.post(
  "/add-parcel",
  RoleValidation(USER_ROLE.marchant),
  ParcelController.addParcel
);

export const ParcelRoutes = router;
