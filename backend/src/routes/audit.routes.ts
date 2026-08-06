import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { auditService } from "../services/audit.service";
import { getAuditHistorySchema } from "../schemas/audit.schema";

const router = Router();

router.get(
  "/documents/:id/audit",
  authenticate,
  validate(getAuditHistorySchema),
  asyncHandler(async (req, res) => {
    const history = await auditService.getDocumentAuditHistory(req.params.id as string);

    res.json({
      auditHistory: history,
    });
  })
);

export default router;