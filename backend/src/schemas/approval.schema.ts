import { z } from "zod";

const documentIdParams = z.object({
  id: z.string().uuid("Invalid document id"),
});

export const approveDocumentSchema = z.object({
  params: documentIdParams,
  body: z.object({
    /** PNG from the sign-here canvas (raw base64 or data URL). */
    signatureImage: z
      .string()
      .min(1, "Signature drawing is required")
      .refine(
        (value) => {
          const base64 = value.replace(/^data:image\/\w+;base64,/, "");
          return base64.length > 0 && /^[A-Za-z0-9+/=]+$/.test(base64);
        },
        { message: "Signature must be a valid base64-encoded PNG image" }
      ),
    /** Page and box where the user drew (sign-here area mapped to PDF space). */
    signaturePage: z.number().int().min(1, "Page number must be at least 1"),
    signatureX: z.number(),
    signatureY: z.number(),
    signatureWidth: z.number().positive("Signature width must be positive"),
    signatureHeight: z.number().positive("Signature height must be positive"),
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

export type ApproveDocumentInput = z.infer<typeof approveDocumentSchema>["body"];
export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>["body"];
export type RequestRevisionInput = z.infer<typeof requestRevisionSchema>["body"];
