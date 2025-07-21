import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { addressController } from "./address.controller";
const router = express.Router();

router.post(
    "/add-address",
    RoleValidation(USER_ROLE.marchant),
    addressController.addAddrss
);
router.get(
    "/myself-addresses",
    RoleValidation(USER_ROLE.marchant),
    addressController.getMySelfAddress
);

router.patch(
    '/update-address/:id',
    RoleValidation(USER_ROLE.marchant),
    addressController.updateAddress
)
router.delete(
    '/delete-address/:id',
    RoleValidation(USER_ROLE.marchant),
    addressController.deleteAddress
)



export const AddressRoutes = router;
