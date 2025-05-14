import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export class CustomError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
  ) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
    this.name = "CustomError";
  }
}

const isZodError = (error: unknown): error is z.ZodError => {
  return error instanceof z.ZodError;
};

const isCustomError = (error: unknown): error is CustomError => {
  return error instanceof CustomError;
};

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error("Error:", err.message);

  if (isZodError(err)) {
    res
      .status(400)
      .json({
        success: false,
        message: "Validation failed",
        errors: err.errors.map((error) => ({
          field: error.path.join("."),
          message: error.message,
        })),
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
      })
      .end();
  } else if (isCustomError(err)) {
    res
      .status(err.statusCode)
      .json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
      })
      .end();
  } else {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  }
};
