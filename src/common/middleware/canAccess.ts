import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { AuthRequest } from "../../types/index";

export const canAccess = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const _req = req as AuthRequest;
    const roleFormToken = _req.auth.role;

    if (!roles.includes(roleFormToken)) {
      const error = createHttpError(403, "You don't have enough permission");
      next(error);
      return;
    }
    next();
  };
};
