import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { SupportController } from "./support.controller";
import { parseFormData } from "../../middlewares/formDataParser";
const router = express.Router();



router.post(
  "/add-support",
  parseFormData,
  RoleValidation(USER_ROLE.marchant),
  SupportController.addSupport
);



export const SupportRoutes = router;
