import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/role";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { adminService } from "../services/admin.service";
import { updateAdminUserSchema, createAdminUserSchema } from "../schemas/admin.schema";

const router = Router();

router.use(authenticate, requireAdmin);

router.get(
  "/departments",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const departments = await adminService.listDepartments();
    res.json(departments);
  })
);

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

router.post(
  "/users",
  requireAdmin,
  validate(createAdminUserSchema),
  asyncHandler(async (req, res) => {
    const user = await adminService.createUser(req.body);
    res.status(201).json(user);
  })
);

router.delete(
  "/users/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await adminService.deleteUser(
      req.params.id as string,
      req.supabaseUserId!
    );
    res.json(result);
  })
);

export default router;