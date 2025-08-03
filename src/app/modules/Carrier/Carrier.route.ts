import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { CarrierController } from "./Carrier.controller";
const router = express.Router();



router.get(
  "/",
  RoleValidation(USER_ROLE.admin),
  CarrierController.getCarriers
);
router.post(
  "/add-carrier",
  RoleValidation(USER_ROLE.admin),
  CarrierController.addCarrier
);

router.post(
    '/assign-order',
    RoleValidation(USER_ROLE.admin),
    CarrierController.assignOrderToCarrier
);

router.delete(
    '/unassign-order',
    RoleValidation(USER_ROLE.admin),
    CarrierController.unassignOrderToCarrier
);

export const CarrierRoutes = router;
