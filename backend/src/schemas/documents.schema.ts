import { z } from "zod";
import { ApprovalType } from "../generated/prisma/browser";

export const approvalChainStepSchema = z.object({
  userId: z.uuid("Invalid user ID"),
  approvalType: z.nativeEnum(ApprovalType),
});

export const createDocumentSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title is required").max(500, "Title cannot exceed 500 characters"),
    description: z.string().trim().max(5000, "Description cannot exceed 5000 characters").optional().or(z.literal("")),

    approvalChain: z.array(approvalChainStepSchema).min(1, "At least one approval step is required")
      .superRefine((steps, ctx) => {
        const finalApprovers = steps.filter(
          (step) => step.approvalType === ApprovalType.FINAL_APPROVER
        );
        if (finalApprovers.length !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Exactly one Final Approver is required",
          });
        }

        // No duplicate users
        const ids = steps.map((s) => s.userId);

        if (new Set(ids).size !== ids.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate users are not allowed in the approval chain",
          });
        }

        // Final approver must be last
        const lastStep = steps[steps.length - 1];
        if (
          lastStep &&
          lastStep.approvalType !== ApprovalType.FINAL_APPROVER
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Final Approver must be the last step",
          });
        }
      }),
  }),
});

export const uploadVersionSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid document id"),
  }),
});

export type UploadVersionInput = z.infer<typeof uploadVersionSchema>["params"];
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>["body"];
export type ApprovalChainStepInput = z.infer<typeof approvalChainStepSchema>;