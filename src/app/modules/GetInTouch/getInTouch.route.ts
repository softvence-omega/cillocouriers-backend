import express from "express";
import { USER_ROLE } from "@prisma/client";
import RoleValidation from "../../middlewares/RoleValidation";
import { GetInTouchController } from "./getInTouch.controller";

const router = express.Router();

router.get(
  "/",
  RoleValidation(USER_ROLE.admin),
  GetInTouchController.GetAllMessages
);
router.post("/add-message", GetInTouchController.insertGetInTouchMessage);


export const GetInTouchRoutes = router;
