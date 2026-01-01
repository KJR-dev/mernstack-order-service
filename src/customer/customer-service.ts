import customerModel from "./customer-model";
import { AddAddress, Customer } from "./customer-types";

export class CustomerService {
  async create(customerData: Customer) {
    return await customerModel.create(customerData);
  }

  async get(userId: string) {
    return await customerModel.findOne({ userId });
  }

  async addAddress(addressData: AddAddress) {
    return await customerModel.findOneAndUpdate(
      {
        _id: addressData.id,
        userId: addressData.userId,
      },
      {
        $push: {
          address: {
            text: addressData.text,
            isDefault: addressData.isDefault,
          },
        },
      },
      {
        new: true,
      },
    );
  }
}
