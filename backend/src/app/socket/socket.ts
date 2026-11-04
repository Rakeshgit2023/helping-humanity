import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { socketAuth } from "../comman/middleware/socket.auth.middleware.js";
import { publishLocation } from "../comman/kafka/location.producer.js";
import ApiError from "../comman/utils/api.error.js";
import * as requestService from "../module/request/service.js";
import {
  removeUserFromRequestChat,
  setChatSocketServer,
} from "./chat-room.js";
import { z } from "zod";

let io: Server | null = null;

type ChatAck = (result: {
  success: boolean;
  message?: string;
  data?: unknown;
}) => void;

const requestIdSchema = z.uuid();

const getRequestId = (payload: unknown) => {
  const requestId =
    payload && typeof payload === "object" && "requestId" in payload
      ? payload.requestId
      : undefined;
  const result = requestIdSchema.safeParse(requestId);
  if (!result.success) throw ApiError.badRequest("A valid requestId is required");
  return result.data;
};

const respondToChatEvent = (
  socket: Socket,
  ack: ChatAck | undefined,
  error?: unknown,
  data?: unknown,
) => {
  if (error) {
    const message =
      error instanceof ApiError ? error.message : "Unable to complete chat action";
    if (!(error instanceof ApiError)) {
      console.error("Chat socket event failed:", error);
    }
    if (ack) ack({ success: false, message });
    else socket.emit("chat:error", { message });
    return;
  }

  if (ack) ack({ success: true, data });
};

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: { origin: "*" }, // production me apna frontend origin
  });
  setChatSocketServer(io);

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`A new user is connected ${socket.id}`);
    console.log(`Connected User ${user}`);

    socket.on("chat:join", async (payload: unknown, ack?: ChatAck) => {
      try {
        const requestId = getRequestId(payload);
        await requestService.joinChatRoom({ requestId }, user);
        await socket.join(requestId);
        socket.to(requestId).emit("chat:participant_joined", {
          requestId,
          userId: user.id,
        });
        respondToChatEvent(socket, ack, undefined, { requestId });
      } catch (error) {
        respondToChatEvent(socket, ack, error);
      }
    });

    socket.on("chat:leave", async (payload: unknown, ack?: ChatAck) => {
      try {
        const requestId = getRequestId(payload);
        const result = await requestService.leaveChatRoom({ requestId }, user);
        if (result.permanent) {
          await removeUserFromRequestChat(user.id, requestId);
        } else {
          await socket.leave(requestId);
        }
        respondToChatEvent(socket, ack, undefined, result);
      } catch (error) {
        respondToChatEvent(socket, ack, error);
      }
    });

    socket.on(
      "chat:message",
      async (
        payload: unknown,
        ack?: ChatAck,
      ) => {
        try {
          const requestId = getRequestId(payload);
          const body =
            payload && typeof payload === "object" && "body" in payload
              ? payload.body
              : undefined;
          const message = await requestService.sendChatMessage(
            { requestId },
            user,
            body,
          );
          socket.to(requestId).emit("chat:message", message);
          respondToChatEvent(socket, ack, undefined, message);
        } catch (error) {
          respondToChatEvent(socket, ack, error);
        }
      },
    );

    void (async () => {
      await socket.join(`user:${user.id}`);
      const requestIds = await requestService.chatRoomsForUser(user.id);
      await socket.join(requestIds);
    })().catch((error: unknown) => {
      console.error("Unable to join user's active chat rooms:", error);
      socket.emit("chat:error", { message: "Unable to load active chat rooms" });
    });

    socket.on("location:update", async (data) => {
      const { lat, lng } = data;
      console.log(
        `Received location update from user ${user.firstName} ${user.lastName}: lat=${lat}, lng=${lng}`,
      );
      await publishLocation(user.id, lat, lng);
    });

    socket.on("disconnect", () => {});
  });

  return io;
};
