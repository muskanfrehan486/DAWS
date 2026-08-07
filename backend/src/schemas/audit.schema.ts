import { z } from "zod";

export const getAuditHistorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getAllDocumentsAuditSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
