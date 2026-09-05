import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../../env.js";
import type { StringValue } from "ms";

export interface User {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: string;
}

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const generateToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  return { rawToken, hashedToken };
};

export const generateAccessToken = (payload: User) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
  });
};

export const verifyAccessToken = (token: string): User => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as User;
};

export const generateRefreshToken = (payload: User) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as StringValue, // ✅
  });
};

export const verifyRefreshToken = (token: string): User => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as User;
};
