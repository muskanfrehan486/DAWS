import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { notificationsService } from "../services/notifications.service";
import {
  listNotificationsSchema,
  markNotificationReadSchema,
  deleteNotificationSchema,
} from "../schemas/notifications.schema";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(listNotificationsSchema),
  asyncHandler(async (req, res) => {
    const { query } = listNotificationsSchema.parse({
      query: req.query,
      params: req.params,
      body: req.body,
    });

    const notifications = await notificationsService.getNotifications(
      req.supabaseUserId!,
      query.isRead
    );

    res.json({ notifications });
  })
);

router.patch(
  "/:id/read",
  validate(markNotificationReadSchema),
  asyncHandler(async (req, res) => {
    const notification = await notificationsService.markAsRead(
      req.params.id as string,
      req.supabaseUserId!
    );

    res.json({
      message: "Notification marked as read.",
      notification,
    });
  })
);

router.delete(
  "/:id",
  validate(deleteNotificationSchema),
  asyncHandler(async (req, res) => {
    const result = await notificationsService.deleteNotification(
      req.params.id as string,
      req.supabaseUserId!
    );

    res.json(result);
  })
);

export default router;
