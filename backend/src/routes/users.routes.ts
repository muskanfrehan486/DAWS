import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { authService } from "../services/auth.service";
import { usersService } from "../services/users.service";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await usersService.listAssignableUsers();
    res.json(users);
  })
);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const result = await authService.getMe(req.supabaseUserId!);
    res.json(result);
  })
);

export default router;
