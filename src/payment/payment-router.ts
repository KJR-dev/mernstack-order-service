import express from "express";
import { asyncWrapper } from "../utils";
import { PaymentController } from "./payment-controller";
import { StripeGateway } from "./stripe";
import { createMessageBroker } from "../common/factories/brokerFactory";
import { CustomerService } from "../customer/customer-service";

const paymentRouter = express.Router();

// todo: move this instantiation to factory
const paymentGateway = new StripeGateway();
const broker = createMessageBroker();
const customerService = new CustomerService();
const paymentController = new PaymentController(
  paymentGateway,
  broker,
  customerService,
);

paymentRouter.post("/webhook", asyncWrapper(paymentController.handleWebhook));

export default paymentRouter;
