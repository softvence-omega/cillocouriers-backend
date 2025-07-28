import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { SupportController } from "./support.controller";
import { parseFormData } from "../../middlewares/formDataParser";
import { upload } from "../../middlewares/upload";
const router = express.Router();

router.get(
  "/my-support-requests",
  RoleValidation(USER_ROLE.marchant),
  SupportController.mySupportRequests
);

// router.post(
//   "/add-support",
//   parseFormData,
//   // upload.single('image'),
//   RoleValidation(USER_ROLE.marchant),
//   SupportController.addSupport
// );

router.post(
  "/add-support",
  upload.single("image"),
  RoleValidation(USER_ROLE.marchant),
  SupportController.addSupport
);

export const SupportRoutes = router;
