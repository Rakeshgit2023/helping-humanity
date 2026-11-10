import { Router } from "express";
import {
  requireFiles,
  upload,
  normalizeMultipart,
} from "../../comman/middleware/upload.middleware.js";
import * as controller from "./controller.js";
import { catchAsyncErrors } from "../../comman/middleware/catchAsyncError.js";
import { isAuthenticated } from "../../comman/middleware/auth.middleware.js";
import { validate } from "../../comman/middleware/validate.middleware.js";
import createRequestDto from "./dto/createRequest.dto.js";

const router: Router = Router();

router.post(
  "/",
  isAuthenticated,
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
  validate(acceptRequestDto, "params"),
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

export default router;
