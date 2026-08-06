import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authService } from "../services/auth.service";
import {
  loginSchema,
  signUpSchema,
  refreshTokenSchema,
} from "../schemas/auth.schema";
import { requireAdmin } from "../middleware/role";

const router = Router();

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await authService.getMe(req.supabaseUserId!);
    res.json(result);
  })
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  })
);

router.post("/sign-up", 
  authenticate, 
  requireAdmin, 
  validate(signUpSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.signUp(req.body);
    res.status(201).json(result);
  })
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body);
    res.json(result);
  })
);

router.post("/create-admin",authenticate,  async (_req, res) => {
  try {
    const admin = await authService.createAdmin();

    res.json({
      message: "Admin created",
      admin,
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : error,
    });
  }
});

export default router;
