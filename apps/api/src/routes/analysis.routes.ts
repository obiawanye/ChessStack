
import { Router } from "express";
import { analyseGameController } from "../controllers/analysis.controller";
import { validateBody } from "../middleware/validate.middleware";
import { analysisSchema } from "../validators/analysis.schema";

const router = Router();

router.post(
  "/",
  validateBody(analysisSchema),
  analyseGameController,
);

export default router;
