import crypto from "node:crypto";
import type { User } from "./jwt.js";

export const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const getClaims = (user: any) => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
};
