import { NextFunction, Response } from "express";
import { Request } from "express-jwt";
import createHttpError from "http-errors";
import { Logger } from "winston";
import { CustomerService } from "./customer-service";
import { Customer } from "./customer-types";

export class CustomerController {
  constructor(
    private customerService: CustomerService,
    private logger: Logger,
  ) {}

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sub: userId, firstName, lastName, email, tenantId } = req.auth;
      const address = [];
      const customer = await this.customerService.get(userId);
      if (!customer) {
        const customerData: Customer = {
          userId,
          firstName,
          lastName,
          email,
          address,
          tenantId,
        };
        const newCustomer = await this.customerService.create(customerData);
        this.logger.info("New customer created", newCustomer);
        return res.json(newCustomer);
      }
      this.logger.info("Customer data fetched", customer);
      res.json(customer);
    } catch (error) {
      this.logger.error("Internal server error", error);
      next(createHttpError(500, "Internal server error", error));
    }
  };
}
