import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/role";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { adminService } from "../services/admin.service";
import { updateAdminUserSchema } from "../schemas/admin.schema";

const router = Router();

router.use(authenticate, requireAdmin);

router.get(
  "/users",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const users = await adminService.listUsers();
    res.json(users);
  })
);

router.get(
  "/users/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await adminService.getUser(req.params.id as string);
    res.json(user);
  })
);

router.patch(
  "/users/:id",
  requireAdmin,
  validate(updateAdminUserSchema),
  asyncHandler(async (req, res) => {
    const user = await adminService.updateUser(req.params.id as string, req.body);
    res.json(user);
  })
);

export default router;