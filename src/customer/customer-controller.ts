import { NextFunction, Response } from "express";
import { Request } from "express-jwt";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { Logger } from "winston";
import { CustomerService } from "./customer-service";
import { Customer } from "./customer-types";

export class CustomerController {
  constructor(
    private customerService: CustomerService,
    private logger: Logger,
  ) {}

  get = async (req: Request, res: Response) => {
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
  };

  addAddress = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(createHttpError(400, result.array()[0].msg as string));
    }
    const { sub: userId } = req.auth;
    const { id } = req.params;
    const { text } = req.body;
    const isDefault: boolean = Boolean(req.body?.isDefault);

    const addressData = {
      id,
      userId,
      text,
      isDefault,
    };

    const customer = await this.customerService.addAddress(addressData);

    res.json(customer);
  };
}
