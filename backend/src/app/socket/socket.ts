import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { socketAuth } from "../comman/middleware/socket.auth.middleware.js";
import { publishLocation } from "../comman/kafka/location.producer.js";
import ApiError from "../comman/utils/api.error.js";
import * as chatService from "../module/chat-history/service.js";
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
    console.log(
      `[Socket] 🟢 Connected: ${user?.firstName} ${user?.lastName || ""} (ID: ${user?.id}, Role: ${user?.role}, Socket: ${socket.id})`,
    );

    socket.on("chat:join", async (payload: unknown, ack?: ChatAck) => {
      try {
        const requestId = getRequestId(payload);
        console.log(
          `[Chat Socket] 📥 'chat:join' received from ${user?.firstName} (${user?.id}) for Room: ${requestId}`,
        );
        await chatService.joinChatRoom({ requestId }, user);
        await socket.join(requestId);
        socket.to(requestId).emit("chat:participant_joined", {
          requestId,
          userId: user.id,
        });
        console.log(
          `[Chat Socket] ✅ User ${user?.firstName} (${user?.id}) joined Room: ${requestId}`,
        );
        respondToChatEvent(socket, ack, undefined, { requestId });
      } catch (error) {
        console.error(
          `[Chat Socket] ❌ 'chat:join' rejected for ${user?.firstName}:`,
          error instanceof Error ? error.message : error,
        );
        respondToChatEvent(socket, ack, error);
      }
    });

    socket.on("chat:leave", async (payload: unknown, ack?: ChatAck) => {
      try {
        const requestId = getRequestId(payload);
        console.log(
          `[Chat Socket] 🚪 'chat:leave' received from ${user?.firstName} (${user?.id}) for Room: ${requestId}`,
        );
        const result = await chatService.leaveChatRoom({ requestId }, user);
        if (result.permanent) {
          await removeUserFromRequestChat(user.id, requestId);
        } else {
          await socket.leave(requestId);
        }
        console.log(
          `[Chat Socket] ✅ User ${user?.firstName} (${user?.id}) left Room: ${requestId} (Permanent: ${result.permanent})`,
        );
        respondToChatEvent(socket, ack, undefined, result);
      } catch (error) {
        console.error(
          `[Chat Socket] ❌ 'chat:leave' failed for ${user?.firstName}:`,
          error instanceof Error ? error.message : error,
        );
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
          console.log(
            `[Chat Socket] 📩 'chat:message' incoming from ${user?.firstName} (${user?.id}) for Room: ${requestId}`,
          );
          const message = await chatService.sendChatMessage(
            { requestId },
            user,
            body,
          );
          respondToChatEvent(socket, ack, undefined, message);
        } catch (error) {
          console.error(
            `[Chat Socket] ❌ 'chat:message' rejected for ${user?.firstName}:`,
            error instanceof Error ? error.message : error,
          );
          respondToChatEvent(socket, ack, error);
        }
      },
    );

    void (async () => {
      await socket.join(`user:${user.id}`);
      const requestIds = await chatService.chatRoomsForUser(user.id);
      if (requestIds.length > 0) {
        console.log(
          `[Chat Socket] 🔄 Auto-joining ${user?.firstName} to (${requestIds.length}) active chat room(s):`,
          requestIds,
        );
      }
      await socket.join(requestIds);
    })().catch((error: unknown) => {
      console.error("Unable to join user's active chat rooms:", error);
      socket.emit("chat:error", { message: "Unable to load active chat rooms" });
    });

    socket.on("location:update", async (data) => {
      const { lat, lng } = data;
      console.log(
        `Socket: User ${user.firstName} Location -> ${lat}, ${lng}`,
      );
      try {
        await publishLocation(user.id, lat, lng);
      } catch (error) {
        console.error("Failed to publish location to Kafka:", error);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket] 🔴 Disconnected: ${user?.firstName} ${user?.lastName || ""} (Socket: ${socket.id}, Reason: ${reason})`,
      );
    });
  });

  return io;
};
