import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { ParcelController } from "./parcel.controller";
const router = express.Router();

router.get(
  "/",
  RoleValidation(USER_ROLE.admin),
  ParcelController.getAllParcels
);

router.get(
  "/my-parcels",
  RoleValidation(USER_ROLE.marchant),
  ParcelController.myParcels
);

router.get(
  "/get-single/:id",
  RoleValidation(USER_ROLE.marchant),
  ParcelController.getSingleParcel
);
router.post(
  "/add-parcel",
  RoleValidation(USER_ROLE.marchant),
  ParcelController.addParcel
);

router.delete(
  "/delete-parcel/:id",
  RoleValidation(USER_ROLE.marchant),
  ParcelController.deleteParcel
);

export const ParcelRoutes = router;
