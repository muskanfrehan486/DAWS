import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors";

export function errorHandler(
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  console.error("Unhandled error:", error);

  res.status(500).json({
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
  });
}
