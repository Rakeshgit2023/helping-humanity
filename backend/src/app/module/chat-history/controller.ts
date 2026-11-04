import type { Request, Response } from "express";
import ApiResponse from "../../comman/utils/api.response.js";
import type { RequestIdParamInput } from "../request/dto/requestIdParam.dto.js";
import type { ChatHistoryQueryInput } from "./dto/chatHistory.dto.js";
import * as chatHistoryService from "./service.js";

export const getChatHistory = async (req: Request, res: Response) => {
  const history = await chatHistoryService.getChatHistory(
    req.validatedParams as RequestIdParamInput,
    req.validatedQuery as ChatHistoryQueryInput,
    req.user,
  );
  return ApiResponse.ok(res, "Chat history fetched successfully", history);
};
