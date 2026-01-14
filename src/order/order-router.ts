import express from "express";
import { createMessageBroker } from "../common/factories/brokerFactory";
import authenticate from "../common/middleware/authenticate";
import logger from "../config/logger";
import { IdempotencyService } from "../idempotency/idempotency-service";
import { StripeGateway } from "../payment/stripe";
import { asyncWrapper } from "../utils";
import { OrderController } from "./order-controller";
import { OrderService } from "./order-service";
import { CustomerService } from "../customer/customer-service";

const orderRouter = express.Router();
const orderService = new OrderService();
const customerService = new CustomerService();
const idempotencyService = new IdempotencyService();
const paymentGateway = new StripeGateway();
const broker = createMessageBroker();
const orderController = new OrderController(
  logger,
  orderService,
  idempotencyService,
  paymentGateway,
  broker,
  customerService
);

orderRouter.post("/", authenticate, asyncWrapper(orderController.create));
orderRouter.get("/mine", authenticate, asyncWrapper(orderController.getById));

export default orderRouter;
