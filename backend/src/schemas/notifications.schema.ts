import { z } from "zod";

export const listNotificationsSchema = z.object({
  query: z.object({
    isRead: z
      .enum(["true", "false"])
      .optional()
      .transform((value) =>
        value === undefined ? undefined : value === "true"
      ),
  }),
});

export const markNotificationReadSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid notification id"),
  }),
});
