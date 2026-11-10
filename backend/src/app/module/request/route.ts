import { Router } from "express";
import {
  requireFiles,
  upload,
  normalizeMultipart
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

export default router;
