import { Router } from "express";
import * as controller from "./controller.js";
import { catchAsyncErrors } from "../../comman/middleware/catchAsyncError.js";
import { validate } from "../../comman/middleware/validate.middleware.js";
import createCategoryDto from "./dto/createCategory.dto.js";
import searchCategoryDto from "./dto/searchCategory.dto.js";

const router: Router = Router();

router.post(
  "/create",
  validate(createCategoryDto),
  catchAsyncErrors(controller.createCategory),
);

router.get(
  "/",
  validate(searchCategoryDto, "query"),
  catchAsyncErrors(controller.searchCategory),
);

export default router;
