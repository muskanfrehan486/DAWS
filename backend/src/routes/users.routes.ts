import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { uploadSignature } from "../middleware/upload";
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

router.post(
  "/me/signature",
  uploadSignature.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Signature image is required" });
      return;
    }

    const result = await usersService.uploadSignature(req.supabaseUserId!, req.file);
    res.status(201).json(result);
  })
);

router.get(
  "/me/signature",
  asyncHandler(async (req, res) => {
    const { buffer, contentType } = await usersService.getSignature(req.supabaseUserId!);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=60");
    res.send(buffer);
  })
);

router.delete(
  "/me/signature",
  asyncHandler(async (req, res) => {
    const result = await usersService.deleteSignature(req.supabaseUserId!);
    res.json(result);
  })
);

export default router;
