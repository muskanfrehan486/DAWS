import { z } from "zod";

export const getAuditHistorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});