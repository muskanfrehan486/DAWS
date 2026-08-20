import { z } from "zod";
import { ApprovalType } from "../generated/prisma/browser";

export const approvalChainStepSchema = z.object({
  userId: z.uuid("Invalid user ID"),
  approvalType: z.nativeEnum(ApprovalType),
});

const approvalChainRefine = (
  steps: z.infer<typeof approvalChainStepSchema>[],
  ctx: z.RefinementCtx
) => {
  const finalApprovers = steps.filter(
    (step) => step.approvalType === ApprovalType.FINAL_APPROVER
  );
  if (finalApprovers.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Exactly one Final Approver is required",
    });
  }

  const ids = steps.map((s) => s.userId);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Duplicate users are not allowed in the approval chain",
    });
  }

  const lastStep = steps[steps.length - 1];
  if (lastStep && lastStep.approvalType !== ApprovalType.FINAL_APPROVER) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Final Approver must be the last step",
    });
  }
};

/** Preparer must sign the PDF before the document enters the approval chain. */
export const preparerSignatureSchema = z
  .object({
    useSavedSignature: z.boolean().optional(),
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
  });

export const createDocumentSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title is required").max(500, "Title cannot exceed 500 characters"),
    description: z.string().trim().max(5000, "Description cannot exceed 5000 characters").optional().or(z.literal("")),
    approvalChain: z
      .array(approvalChainStepSchema)
      .min(1, "At least one approval step is required")
      .superRefine(approvalChainRefine),
    signature: preparerSignatureSchema,
  }),
});

export const updateDocumentSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid document id"),
  }),
  body: z.object({
    title: z.string().trim().min(1, "Title is required").max(500).optional(),
    description: z
      .string()
      .trim()
      .max(5000, "Description cannot exceed 5000 characters")
      .optional()
      .or(z.literal("")),
    approvalChain: z
      .array(approvalChainStepSchema)
      .min(1, "At least one approval step is required")
      .optional()
      .superRefine((steps, ctx) => {
        if (!steps) return;
        approvalChainRefine(steps, ctx);
      }),
    signature: preparerSignatureSchema,
  }),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>["body"];
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>["body"];
export type ApprovalChainStepInput = z.infer<typeof approvalChainStepSchema>;
export type PreparerSignatureInput = z.infer<typeof preparerSignatureSchema>;