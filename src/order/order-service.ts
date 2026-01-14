import mongoose from "mongoose";
import idempotencyModel from "../idempotency/idempotency-model";
import orderModel from "./order-model";

export class OrderService {
  async create(data) {
    const session = await mongoose.startSession();
    try {
      await session.startTransaction();
      const [newOder] = await orderModel.create(
        [
          {
            cart: data.cart,
            address: data.address,
            comment: data.comment,
            customerId: data.customerId,
            deliveryCharges: data.DELIVERY_CHARGES,
            discount: data.discountAmount,
            taxes: data.taxes,
            tenantId: data.tenantId,
            total: data.finalTotal,
            paymentMode: data.paymentMode,
            orderStatus: data.orderStatus,
            paymentStatus: data.paymentStatus,
          },
        ],
        { session },
      );

      await idempotencyModel.create(
        [
          {
            key: data.idempotency,
            response: newOder,
          },
        ],
        { session },
      );
      await session.commitTransaction();
      return newOder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async get(customerId: mongoose.Types.ObjectId) {
    return await orderModel.find({ customerId }, { cart: 0});
  }
}
