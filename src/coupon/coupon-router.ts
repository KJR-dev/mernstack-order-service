import express from "express";
import { Roles } from "../common/constants";
import authenticate from "../common/middleware/authenticate";
import { canAccess } from "../common/middleware/canAccess";
import logger from "../config/logger";
import { asyncWrapper } from "../utils";
import { CouponController } from "./coupon-controller";
import { CouponService } from "./coupon-service";
import {
  couponCreateValidator,
  couponIdValidator,
  couponTenantIdValidator,
  couponVerifyValidator,
} from "./coupon-validator";

const couponRouter = express.Router();
const couponService = new CouponService();
const couponController = new CouponController(couponService, logger);

couponRouter.post(
  "/",
  authenticate,
  canAccess([Roles.ADMIN, Roles.MANAGER]),
  couponCreateValidator,
  asyncWrapper(couponController.create),
);

couponRouter.get(
  "/",
  authenticate,
  canAccess([Roles.ADMIN]),
  asyncWrapper(couponController.getAll),
);

couponRouter.get(
  "/:id/:tenantId",
  authenticate,
  canAccess([Roles.ADMIN, Roles.MANAGER]),
  couponIdValidator,
  couponTenantIdValidator,
  asyncWrapper(couponController.getById),
);

couponRouter.patch(
  "/:id",
  authenticate,
  canAccess([Roles.ADMIN, Roles.MANAGER]),
  couponIdValidator,
  couponCreateValidator,
  asyncWrapper(couponController.update),
);

couponRouter.delete(
  "/:id/:tenantId",
  authenticate,
  canAccess([Roles.ADMIN, Roles.MANAGER]),
  couponIdValidator,
  couponTenantIdValidator,
  asyncWrapper(couponController.delete),
);

couponRouter.post(
  "/verify",
  authenticate,
  couponVerifyValidator,
  asyncWrapper(couponController.verify),
);

export default couponRouter;
