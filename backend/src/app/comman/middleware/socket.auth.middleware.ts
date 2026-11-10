import type { Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import ApiError from "../utils/api.error.js";

export const socketAuth = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      throw ApiError.unauthorized("Authentication token required");
    }

    const decoded = verifyAccessToken(token);

    const userId = decoded.id;

    if (!userId) {
      throw ApiError.unauthorized("User ID not found in token");
    }

    socket.data.user = decoded;
    next();
  } catch (error) {
    console.error("Socket authentication failed:", error);
    next(ApiError.internal("Socket authentication failed"));
  }
};
