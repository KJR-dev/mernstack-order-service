import { body, param } from "express-validator";

export const couponCreateValidator = [
  body("title")
    .exists()
    .withMessage("title is required")
    .isString()
    .withMessage("title should be a string"),
  body("code")
    .exists()
    .withMessage("title is required")
    .isString()
    .withMessage("title should be a string"),
  body("discount")
    .exists()
    .withMessage("discount is required")
    .isNumeric()
    .withMessage("discount should be a number"),
  body("validUpto")
    .exists()
    .withMessage("validUpto is required")
    .isString()
    .withMessage("validUpto should be a date"),
  body("tenantId")
    .exists()
    .withMessage("tenantId is required")
    .isNumeric()
    .withMessage("tenantId should be a number"),
];

export const couponIdValidator = [
  param("id")
    .exists()
    .withMessage("id is required")
    .isString()
    .withMessage("id should be a string"),
];

export const couponTenantIdValidator = [
  param("id")
    .exists()
    .withMessage("id is required")
    .isString()
    .withMessage("id should be a string"),
];

export const couponVerifyValidator = [
  body("code")
    .exists()
    .withMessage("code is required")
    .isString()
    .withMessage("code should be a string"),

  body("tenantId")
    .exists()
    .withMessage("tenantId is required")
    .isNumeric()
    .withMessage("tenantId should be a number"),
];
