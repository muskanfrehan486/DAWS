import { z } from "zod";

const documentIdParams = z.object({
  id: z.string().uuid("Invalid document id"),
});

export const approveDocumentSchema = z.object({
  params: documentIdParams,
  body: z
    .object({
      /** When true, the server loads the actor's saved signature from storage. */
      useSavedSignature: z.boolean().optional(),
      /** PNG/JPEG from the sign-here canvas (raw base64 or data URL). */
      signatureImage: z.string().optional(),
      signaturePage: z.number().int().min(1, "Page number must be at least 1"),
      signatureX: z.number(),
      signatureY: z.number(),
      signatureWidth: z.number().positive("Signature width must be positive"),
      signatureHeight: z.number().positive("Signature height must be positive"),
    })
    .superRefine((data, ctx) => {
      if (data.useSavedSignature) {
        return;
      }

      if (!data.signatureImage?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Signature drawing is required",
          path: ["signatureImage"],
        });
        return;
      }

      const base64 = data.signatureImage.replace(/^data:image\/\w+;base64,/, "");
      if (base64.length === 0 || !/^[A-Za-z0-9+/=]+$/.test(base64)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Signature must be a valid base64-encoded image",
          path: ["signatureImage"],
        });
      }
    }),
});

export const rejectDocumentSchema = z.object({
  params: documentIdParams,
  body: z
    .object({
      comment: z
        .string()
        .trim()
        .max(2000, "Comment cannot exceed 2000 characters")
        .optional(),
    })
    .default({}),
});

export const requestRevisionSchema = z.object({
  params: documentIdParams,
  body: z.object({
    comment: z
      .string()
      .trim()
      .min(1, "Comment is required for revision requests")
      .max(2000, "Comment cannot exceed 2000 characters"),
  }),
});

export const skipWorkflowStepSchema = z.object({
  params: documentIdParams,
  body: z.object({
    reason: z
      .string()
      .trim()
      .min(1, "A reason is required to skip a workflow step")
      .max(2000, "Reason cannot exceed 2000 characters"),
  }),
});

export type ApproveDocumentInput = z.infer<typeof approveDocumentSchema>["body"];
export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>["body"];
export type RequestRevisionInput = z.infer<typeof requestRevisionSchema>["body"];
export type SkipWorkflowStepInput = z.infer<typeof skipWorkflowStepSchema>["body"];
