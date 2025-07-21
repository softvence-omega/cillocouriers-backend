import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { customarController } from "./customar.controller";
const router = express.Router();

router.post(
    "/add-customer",
    RoleValidation(USER_ROLE.marchant),
    customarController.addCustomer
);
router.get(
    "/myself-customers",
    RoleValidation(USER_ROLE.marchant),
    customarController.getMySelfCustomers
);

router.patch(
    '/update-customer/:id',
    RoleValidation(USER_ROLE.marchant),
    customarController.updateCustomer
)
router.delete(
    '/delete-customer/:id',
    RoleValidation(USER_ROLE.marchant),
    customarController.deleteCustomer
)



export const CustomerRoutes = router;
