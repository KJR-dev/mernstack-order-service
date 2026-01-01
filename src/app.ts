import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middleware/globalErrorHandler";
import customerRouter from "./customer/customer-router";
import couponRouter from "./coupon/coupon-router";

const app = express();
app.use(cookieParser());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!" });
});

app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/coupon", couponRouter);

app.use(globalErrorHandler);

export default app;
