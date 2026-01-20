import config from "config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middleware/globalErrorHandler";
import couponRouter from "./coupon/coupon-router";
import customerRouter from "./customer/customer-router";
import orderRouter from "./order/order-router";
import paymentRouter from "./payment/payment-router";

const app = express();
const ALLOWED_DOMAINS = [
  config.get("frontend.clientUI"),
  config.get("frontend.adminUI"),
];
app.use(
  cors({
    origin: ALLOWED_DOMAINS as string[],
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!" });
});

app.use("/api/v1/order/customer", customerRouter);
app.use("/api/v1/order/coupons", couponRouter);
app.use("/api/v1/order/orders", orderRouter);
app.use("/api/v1/order/payments", paymentRouter);

app.use(globalErrorHandler);

export default app;
