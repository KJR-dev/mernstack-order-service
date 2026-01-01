import { NextFunction, Response } from "express";
import { Request } from "express-jwt";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { Logger } from "winston";
import { CouponService } from "./coupon-service";

export class CouponController {
  constructor(
    private couponService: CouponService,
    private logger: Logger,
  ) {}
  create = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(createHttpError(400, result.array()[0].msg as string));
    }
    const { tenantId: authTenantId } = req.auth;
    const { title, code, discount, validUpto, tenantId } = req.body;

    if (authTenantId !== tenantId) {
      return next(
        createHttpError(403, "You can't create coupon for other tenant"),
      );
    }

    const couponData = {
      title,
      code,
      discount,
      validUpto,
      tenantId,
    };

    const coupon = await this.couponService.create(couponData);

    res.status(201).json(coupon);
  };

  getAll = async (req: Request, res: Response) => {
    const coupon = await this.couponService.getAll();
    res.json(coupon);
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(createHttpError(400, result.array()[0].msg as string));
    }

    const { id, tenantId } = req.params;
    let coupon = null;

    if (req.auth.tenantId !== Number(tenantId)) {
      return next(
        createHttpError(403, "You can't get coupon for other tenant"),
      );
    }

    coupon = await this.couponService.getById(id, tenantId);
    res.status(200).json(coupon);
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(createHttpError(400, result.array()[0].msg as string));
    }
    const { tenantId: authTenantId } = req.auth;
    const { title, code, discount, validUpto, tenantId } = req.body;
    const { id } = req.params;

    if (authTenantId !== tenantId) {
      return next(
        createHttpError(403, "You can't create coupon for other tenant"),
      );
    }

    const couponData = {
      id,
      title,
      code,
      discount,
      validUpto,
      tenantId,
    };

    const coupon = await this.couponService.update(couponData);

    res.status(202).json(coupon);
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(createHttpError(400, result.array()[0].msg as string));
    }

    const { id, tenantId } = req.params;

    if (req.auth.tenantId !== Number(tenantId)) {
      return next(
        createHttpError(403, "You can't get coupon for other tenant"),
      );
    }

    await this.couponService.delete(id, tenantId);
    res.status(204).json();
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(createHttpError(400, result.array()[0].msg as string));
    }

    const { code, tenantId } = req.body;

    const coupon = await this.couponService.verify(code, tenantId);
    if (!coupon) {
      return next(createHttpError(400, "Coupon does not exist"));
    }
    const currentDate = new Date();
    const couponDate = new Date(coupon.validUpto);

    if (currentDate <= couponDate) {
      return res.status(200).json({ valid: true, discount: coupon.discount });
    }
    return res.status(200).json({ valid: false, discount: 0 });
  };
}
