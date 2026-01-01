import couponModel from "./coupon-model";
import { Coupon } from "./coupon-types";

export class CouponService {
  async create(couponData: Coupon) {
    return await couponModel.create(couponData);
  }

  async getAll() {
    return await couponModel.find();
  }

  async getById(id: string, tenantId: string) {
    return await couponModel.findOne({
      _id: id,
      tenantId,
    });
  }
  async update(couponData: Coupon) {
    return await couponModel.findOneAndUpdate(
      {
        _id: couponData.id,
      },
      {
        title: couponData.title,
        code: couponData.code,
        discount: couponData.discount,
        validUpto: couponData.validUpto,
        tenantId: couponData.tenantId,
      },
      {
        new: true,
      },
    );
  }

  async delete(id: string, tenantId: string) {
    return await couponModel.findOneAndDelete({
      _id: id,
      tenantId,
    });
  }

  async verify(code: string, tenantId: string) {
    return await couponModel.findOne({
      code,
      tenantId,
    });
  }
}
