import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middleware/globalErrorHandler";
import couponRouter from "./coupon/coupon-router";
import customerRouter from "./customer/customer-router";
import orderRouter from "./order/order-router";

const app = express();
app.use(cookieParser());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!" });
});

app.use("/api/v1/order/customer", customerRouter);
app.use("/api/v1/order/coupons", couponRouter);
app.use("/api/v1/order/orders", orderRouter);

app.use(globalErrorHandler);

export default app;
