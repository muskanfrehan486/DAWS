import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { approvalService } from "../services/approval.service";
import {
  approveDocumentSchema,
  rejectDocumentSchema,
  requestRevisionSchema,
} from "../schemas/approval.schema";

const router = Router();

router.post(
  "/documents/:id/approve",
  authenticate,
  validate(approveDocumentSchema),
  asyncHandler(async (req, res) => {
    const result = await approvalService.approve(
      req.params.id as string,
      req.supabaseUserId!,
      req.body,
      req.ip
    );

    res.json(result);
  })
);

router.post(
  "/documents/:id/reject",
  authenticate,
  validate(rejectDocumentSchema),
  asyncHandler(async (req, res) => {
    const result = await approvalService.reject(
      req.params.id as string,
      req.supabaseUserId!,
      req.body,
      req.ip
    );

    res.json(result);
  })
);

router.post(
  "/documents/:id/request-revision",
  authenticate,
  validate(requestRevisionSchema),
  asyncHandler(async (req, res) => {
    const result = await approvalService.requestRevision(
      req.params.id as string,
      req.supabaseUserId!,
      req.body,
      req.ip
    );

    res.json(result);
  })
);

export default router;
