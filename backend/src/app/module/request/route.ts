import { Router } from "express";
import { upload } from "../../comman/middleware/upload.middleware.js";
import * as controller from "./controller.js";
import { catchAsyncErrors } from "../../comman/middleware/catchAsyncError.js";

const router: Router = Router();

router.post(
  "/",
  upload.array("files", 2),
  catchAsyncErrors(controller.createRequest),
);

export default router;
