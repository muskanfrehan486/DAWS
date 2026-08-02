import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { authService } from "../services/auth.service";

const router = Router();

router.use(authenticate);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const result = await authService.getMe(req.supabaseUserId!);
    res.json(result);
  })
);

export default router;
