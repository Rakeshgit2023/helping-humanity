import type { Server } from "socket.io";

export type ChatMessage = {
  id: string;
  requestId: string;
  senderId: string | null;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  body: string;
  createdAt: Date;
};

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

  console.log(`[Chat Socket] ➕ Auto-enrolling User ${userId} into Request Chat Room: ${requestId}`);
  await io.in(userRoom(userId)).socketsJoin(requestId);
  io.to(requestId).emit("chat:participant_joined", { requestId, userId });
};

export const removeUserFromRequestChat = async (
  userId: string,
  requestId: string,
) => {
  if (!io) return;

  console.log(`[Chat Socket] ➖ Removing User ${userId} from Request Chat Room: ${requestId}`);
  await io.in(userRoom(userId)).socketsLeave(requestId);
  io.to(requestId).emit("chat:participant_left", { requestId, userId });
};

export const publishChatMessage = (message: ChatMessage) => {
  if (!io) return;

  const room = io.sockets.adapter.rooms.get(message.requestId);
  const recipientSockets = room ? Array.from(room) : [];

  const recipients = recipientSockets.map((sId) => {
    const s = io?.sockets.sockets.get(sId);
    const u = s?.data?.user;
    return u
      ? `${u.firstName} ${u.lastName || ""} (ID: ${u.id}, Role: ${u.role})`
      : `Socket: ${sId}`;
  });

  console.log(`\n======================================================`);
  console.log(`[Chat Socket] 💬 MESSAGE BROADCAST`);
  console.log(`  Room (Request ID) : ${message.requestId}`);
  console.log(`  Sender            : ${message.senderFirstName || "User"} ${message.senderLastName || ""} (ID: ${message.senderId})`);
  console.log(`  Message           : "${message.body}"`);
  console.log(`  Delivered to (${recipients.length}) connected recipient(s):`);
  if (recipients.length > 0) {
    recipients.forEach((r) => console.log(`    👉 ${r}`));
  } else {
    console.log(`    (No active sockets in room)`);
  }
  console.log(`======================================================\n`);

  io.to(message.requestId).emit("chat:message", message);
};

export const closeRequestChat = async (requestId: string) => {
  if (!io) return;

  console.log(`[Chat Socket] 🔒 Closing Chat Room for Request: ${requestId}`);
  io.to(requestId).emit("chat:closed", { requestId });
  await io.in(requestId).socketsLeave(requestId);
};
