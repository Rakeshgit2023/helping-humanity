import {
  and,
  eq,
  isNull,
  lt,
  notInArray,
} from "drizzle-orm/sql/expressions/conditions";
import { desc } from "drizzle-orm/sql/expressions/select";
import { db } from "../../../db/index.js";
import {
  requestAssignments,
  chatMessages,
  chatParticipants,
  requests,
  users,
} from "../../../db/schema.js";
import { withErrorHandling } from "../../comman/middleware/withErrorHandling.js";
import ApiError from "../../comman/utils/api.error.js";
import type { User } from "../../comman/utils/jwt.js";
import type { ChatHistoryQueryInput } from "./dto/chatHistory.dto.js";
import type { RequestIdParamInput } from "../request/dto/requestIdParam.dto.js";
import { publishChatMessage } from "../../socket/chat-room.js";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const ensureActiveChatParticipant = async (
  tx: Tx,
  requestId: string,
  requesterId: string,
  userId: string,
) => {
  if (requesterId !== userId) {
    const [assignment] = await tx
      .select({ volunteerId: requestAssignments.volunteerId })
      .from(requestAssignments)
      .where(
        and(
          eq(requestAssignments.requestId, requestId),
          eq(requestAssignments.volunteerId, userId),
          isNull(requestAssignments.cancelledAt),
        ),
      )
      .limit(1);

    if (!assignment) {
      throw ApiError.forbidden(
        "Only the requester and accepted volunteers can join this chat",
      );
    }
  }

  await tx
    .insert(chatParticipants)
    .values({ requestId, userId })
    .onConflictDoNothing();

  const [participant] = await tx
    .select({ leftAt: chatParticipants.leftAt })
    .from(chatParticipants)
    .where(
      and(
        eq(chatParticipants.requestId, requestId),
        eq(chatParticipants.userId, userId),
      ),
    )
    .limit(1);

  if (!participant || participant.leftAt) {
    throw ApiError.forbidden("You have left this chat and cannot rejoin");
  }
};

export const chatRoomsForUser = withErrorHandling(
  "Get active chat rooms for user",
  async (userId: string) => {
    const participants = await db
      .select({ requestId: chatParticipants.requestId })
      .from(chatParticipants)
      .innerJoin(requests, eq(requests.id, chatParticipants.requestId))
      .where(
        and(
          eq(chatParticipants.userId, userId),
          isNull(chatParticipants.leftAt),
          notInArray(requests.status, ["completed", "cancelled", "expired"]),
        ),
      );

    return participants.map((participant) => participant.requestId);
  },
);

export const joinChatRoom = withErrorHandling(
  "Join request chat",
  async ({ requestId }: RequestIdParamInput, user: User) => {
    await db.transaction(async (tx) => {
      const [request] = await tx
        .select({ requesterId: requests.requesterId, status: requests.status })
        .from(requests)
        .where(eq(requests.id, requestId))
        .limit(1);

      if (!request) throw ApiError.notFound("Request not found");
      if (["completed", "cancelled", "expired"].includes(request.status)) {
        throw ApiError.badRequest("This request chat is closed");
      }

      await ensureActiveChatParticipant(
        tx,
        requestId,
        request.requesterId,
        user.id,
      );
    });

    return { requestId };
  },
);

export const leaveChatRoom = withErrorHandling(
  "Leave request chat",
  async ({ requestId }: RequestIdParamInput, user: User) => {
    return db.transaction(async (tx) => {
      const [request] = await tx
        .select({ requesterId: requests.requesterId })
        .from(requests)
        .where(eq(requests.id, requestId))
        .limit(1);

      if (!request) throw ApiError.notFound("Request not found");
      if (request.requesterId === user.id) {
        return { requestId, permanent: false };
      }

      const [participant] = await tx
        .select({ leftAt: chatParticipants.leftAt })
        .from(chatParticipants)
        .where(
          and(
            eq(chatParticipants.requestId, requestId),
            eq(chatParticipants.userId, user.id),
          ),
        )
        .limit(1);

      if (!participant || participant.leftAt) {
        throw ApiError.forbidden(
          "You are not an active participant in this chat",
        );
      }

      const [assignment] = await tx
        .select({ volunteerId: requestAssignments.volunteerId })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            eq(requestAssignments.volunteerId, user.id),
            isNull(requestAssignments.cancelledAt),
          ),
        )
        .limit(1);

      if (!assignment) {
        throw ApiError.forbidden("Only accepted volunteers can leave this chat");
      }

      await tx
        .update(chatParticipants)
        .set({ leftAt: new Date() })
        .where(
          and(
            eq(chatParticipants.requestId, requestId),
            eq(chatParticipants.userId, user.id),
            isNull(chatParticipants.leftAt),
          ),
        );

      return { requestId, permanent: true };
    });
  },
);

export const sendChatMessage = withErrorHandling(
  "Send request chat message",
  async (
    { requestId }: RequestIdParamInput,
    user: User,
    body: unknown,
  ) => {
    if (typeof body !== "string" || !body.trim() || body.trim().length > 4000) {
      throw ApiError.badRequest("Message must contain 1 to 4000 characters");
    }

    const message = await db.transaction(async (tx) => {
      const [request] = await tx
        .select({ requesterId: requests.requesterId, status: requests.status })
        .from(requests)
        .where(eq(requests.id, requestId))
        .limit(1);

      if (!request) throw ApiError.notFound("Request not found");
      if (["completed", "cancelled", "expired"].includes(request.status)) {
        throw ApiError.badRequest("This request chat is closed");
      }

      await ensureActiveChatParticipant(
        tx,
        requestId,
        request.requesterId,
        user.id,
      );

      const [message] = await tx
        .insert(chatMessages)
        .values({ requestId, senderId: user.id, body: body.trim() })
        .returning({
          id: chatMessages.id,
          requestId: chatMessages.requestId,
          senderId: chatMessages.senderId,
          body: chatMessages.body,
          createdAt: chatMessages.createdAt,
        });

      if (!message) throw ApiError.internal("Failed to save chat message");
      return message;
    });

    const fullMessage = {
      ...message,
      senderFirstName: user.firstName,
      senderLastName: user.lastName,
    };
    publishChatMessage(fullMessage);
    return fullMessage;
  },
);

export const getChatHistory = withErrorHandling(
  "Get request chat history",
  async (
    { requestId }: RequestIdParamInput,
    { limit, before }: ChatHistoryQueryInput,
    user: User,
  ) => {
    const [request] = await db
      .select({ requesterId: requests.requesterId })
      .from(requests)
      .where(eq(requests.id, requestId))
      .limit(1);

    if (!request) throw ApiError.notFound("Request not found");

    const [participant] = await db
      .select({ userId: chatParticipants.userId })
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.requestId, requestId),
          eq(chatParticipants.userId, user.id),
          isNull(chatParticipants.leftAt),
        ),
      )
      .limit(1);

    if (request.requesterId !== user.id && !participant) {
      throw ApiError.forbidden("You are not a participant in this request chat");
    }

    const conditions = [eq(chatMessages.requestId, requestId)];
    if (before) conditions.push(lt(chatMessages.createdAt, new Date(before)));

    const rows = await db
      .select({
        id: chatMessages.id,
        requestId: chatMessages.requestId,
        senderId: chatMessages.senderId,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        body: chatMessages.body,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .leftJoin(users, eq(users.id, chatMessages.senderId))
      .where(and(...conditions))
      .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const messages = rows.slice(0, limit).reverse();

    return {
      requestId,
      messages,
      hasMore,
      nextBefore: hasMore ? messages[0]?.createdAt.toISOString() ?? null : null,
    };
  },
);
