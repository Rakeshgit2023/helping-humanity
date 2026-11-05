import { Router } from "express";
import {
  requireFiles,
  upload,
  normalizeMultipart,
} from "../../comman/middleware/upload.middleware.js";
import * as controller from "./controller.js";
import { catchAsyncErrors } from "../../comman/middleware/catchAsyncError.js";
import {
  authorize,
  isAuthenticated,
} from "../../comman/middleware/auth.middleware.js";
import { validate } from "../../comman/middleware/validate.middleware.js";
import createRequestDto from "./dto/createRequest.dto.js";
import requestIdParamDto from "./dto/requestIdParam.dto.js";
import acceptRequestDto from "./dto/acceptRequest.dto.js";
import * as chatHistoryController from "../chat-history/controller.js";
import chatHistoryQueryDto from "../chat-history/dto/chatHistory.dto.js";
import sendChatMessageDto from "../chat-history/dto/sendChatMessage.dto.js";

const router: Router = Router();

router.post(
  "/",
  isAuthenticated,
  authorize("user", "volunteer"),
  upload("image", 2, true).any(),
  normalizeMultipart,
  validate(createRequestDto, "body", true),
  catchAsyncErrors(controller.createRequest),
);

router.post(
  "/:requestId/volunteers",
  isAuthenticated,
  authorize("user", "volunteer"),
  validate(requestIdParamDto, "params"),
  catchAsyncErrors(controller.volunteersForRequest),
);

router.post(
  "/:requestId/accept",
  isAuthenticated,
  authorize("volunteer"),
  validate(requestIdParamDto, "params"),
  validate(acceptRequestDto, "body"),
  catchAsyncErrors(controller.acceptRequest),
);

router.post(
  "/:requestId/proceed",
  isAuthenticated,
  authorize("user", "volunteer"),
  validate(requestIdParamDto, "params"),
  catchAsyncErrors(controller.proceedWithAccepted),
);

router.post(
  "/:requestId/start",
  isAuthenticated,
  authorize("volunteer"),
  validate(requestIdParamDto, "params"),
  catchAsyncErrors(controller.startRequest),
);

router.post(
  "/:requestId/decline",
  isAuthenticated,
  authorize("volunteer"),
  validate(requestIdParamDto, "params"),
  catchAsyncErrors(controller.declineRequest),
);

router.post(
  "/:requestId/complete",
  isAuthenticated,
  authorize("volunteer"),
  validate(requestIdParamDto, "params"),
  catchAsyncErrors(controller.completeRequest),
);

router.post(
  "/:requestId/cancel",
  isAuthenticated,
  authorize("user", "volunteer"),
  validate(requestIdParamDto, "params"),
  catchAsyncErrors(controller.cancelRequest),
);

router.get(
  "/:requestId/chat/history",
  isAuthenticated,
  authorize("user", "volunteer"),
  validate(requestIdParamDto, "params"),
  validate(chatHistoryQueryDto, "query"),
  catchAsyncErrors(chatHistoryController.getChatHistory),
);

router.post(
  "/:requestId/chat/messages",
  isAuthenticated,
  authorize("user", "volunteer"),
  validate(requestIdParamDto, "params"),
  validate(sendChatMessageDto, "body"),
  catchAsyncErrors(chatHistoryController.sendChatMessage),
);

export default router;
