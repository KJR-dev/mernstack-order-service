import { body, param } from "express-validator";

export const createAddressValidator = [
  param("id")
    .exists()
    .withMessage("id is required")
    .isString()
    .withMessage("id should be a string"),

  body("text")
    .exists()
    .withMessage("Text is required")
    .isString()
    .withMessage("Text should be a string"),
  body("isDefault")
    .optional()
    .withMessage("isPublic is required")
    .isBoolean()
    .withMessage("isPublic should be a boolean"),
];
