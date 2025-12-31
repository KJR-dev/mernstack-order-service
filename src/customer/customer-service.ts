import customerModel from "./customer-model";
import { Customer } from "./customer-types";

export class CustomerService {
  async create(customerData: Customer) {
    return await customerModel.create(customerData);
  }
  async get(userId: string) {
    return await customerModel.findOne({ userId });
  }
}
