import express from "express";
import authenticate from "../common/middleware/authenticate";
import logger from "../config/logger";
import { IdempotencyService } from "../idempotency/idempotency-service";
import { StripeGateway } from "../payment/stripe";
import { asyncWrapper } from "../utils";
import { OrderController } from "./order-controller";
import { OrderService } from "./order-service";
import { createMessageBroker } from "../common/factories/brokerFactory";

const orderRouter = express.Router();
const orderService = new OrderService();
const idempotencyService = new IdempotencyService();
const paymentGateway = new StripeGateway();
const broker = createMessageBroker();
const orderController = new OrderController(
  logger,
  orderService,
  idempotencyService,
  paymentGateway,
  broker,
);

orderRouter.post("/", authenticate, asyncWrapper(orderController.create));

export default orderRouter;
