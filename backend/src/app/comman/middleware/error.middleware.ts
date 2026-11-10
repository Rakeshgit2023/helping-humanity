import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err?.code === "23505" || err?.cause?.code === "23505") {
    return res
      .status(409)
      .json({ success: false, message: "This record already exists" });
  }
  if (err?.code === "23503" || err?.cause?.code === "23503") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid reference" });
  }

  console.error("Unhandled error reached globalErrorHandler:", err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
};
