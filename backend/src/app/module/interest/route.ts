import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../../comman/middleware/validate.middleware.js";
import createInterestDto from "./dto/create.dto.js";
import searchDto from "./dto/search.dto.js";

const router: Router = Router();

router.post("/", validate(createInterestDto), controller.create);
router.get("/", validate(searchDto, "query"), controller.search);

export default router;
