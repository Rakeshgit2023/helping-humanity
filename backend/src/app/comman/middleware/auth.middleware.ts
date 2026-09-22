import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error.js";
import { verifyAccessToken, type User } from "../utils/jwt.js";
import { db } from "../../../db/index.js";
import { users } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { type Role } from "../utils/constant.js";

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("User not authenticated");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw ApiError.unauthorized("User not authenticated");
  }

  let decode: User;

  try {
    decode = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Access token expired or invalid");
  }

  const [existUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, decode.id));

  if (!existUser) {
    throw ApiError.unauthorized("User not found");
  }

  req.user = decode;

  next();
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        "You do not have permission to perform this action.",
      );
    }

    next();
  };
};
