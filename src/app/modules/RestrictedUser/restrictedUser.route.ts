import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { restrictedUserController } from "./restrictedUser.controller";
const router = express.Router();

router.get(
  "/",
  RoleValidation(USER_ROLE.marchant),
  restrictedUserController.getAllRestrictedUser
);
router.get(
  "/:id",
  RoleValidation(USER_ROLE.marchant),
  restrictedUserController.getSingleRestrictedUser
);

router.post(
  "/add-restricted-user",
  RoleValidation(USER_ROLE.marchant),
  restrictedUserController.addRestrictedUser
);

router.delete(
  "/:id",
  RoleValidation(USER_ROLE.marchant),
  restrictedUserController.deleteRestrictedUser
);

export const RestrictedUserRoutes = router;
