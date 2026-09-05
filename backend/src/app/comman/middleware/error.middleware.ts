import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error.js";
import path from "node:path";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const acceptsHtml = req.headers.accept?.includes("text/html");

  // Agar ApiError hai
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  // Unexpected error
  console.error("Unexpected Error:", err);

  if (acceptsHtml) {
    return res.status(500).sendFile(path.resolve("public", "error.html"));
  }

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal Server Error",
  });
};
