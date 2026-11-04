import type { Server } from "socket.io";

let io: Server | null = null;

const userRoom = (userId: string) => `user:${userId}`;

export const setChatSocketServer = (server: Server) => {
  io = server;
};

export const joinUserToRequestChat = async (
  userId: string,
  requestId: string,
) => {
  if (!io) return;

  await io.in(userRoom(userId)).socketsJoin(requestId);
  io.to(requestId).emit("chat:participant_joined", { requestId, userId });
};

export const removeUserFromRequestChat = async (
  userId: string,
  requestId: string,
) => {
  if (!io) return;

  await io.in(userRoom(userId)).socketsLeave(requestId);
  io.to(requestId).emit("chat:participant_left", { requestId, userId });
};

export const closeRequestChat = async (requestId: string) => {
  if (!io) return;

  io.to(requestId).emit("chat:closed", { requestId });
  await io.in(requestId).socketsLeave(requestId);
};
