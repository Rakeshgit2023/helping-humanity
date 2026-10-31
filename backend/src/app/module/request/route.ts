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
import volunteersForRequestDto from "./dto/volunteersForRequest.dto.js";

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
  "/volunteers",
  isAuthenticated,
  authorize("user", "volunteer"),
  validate(volunteersForRequestDto),
  catchAsyncErrors(controller.volunteersForRequest),
);

export default router;
