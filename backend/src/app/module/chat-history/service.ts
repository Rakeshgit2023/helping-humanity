import { and, eq, lt } from "drizzle-orm/sql/expressions/conditions";
import { desc } from "drizzle-orm/sql/expressions/select";
import { db } from "../../../db/index.js";
import {
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
