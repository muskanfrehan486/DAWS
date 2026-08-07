import { Router, Response } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { auditService } from "../services/audit.service";
import {
  getAllDocumentsAuditSchema,
  getAuditHistorySchema,
} from "../schemas/audit.schema";

const router = Router();

function sendCsv(res: Response, filename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

router.get(
  "/audit/documents/export",
  authenticate,
  asyncHandler(async (req, res) => {
    const csv = await auditService.exportAllDocumentsAuditCsv(
      req.supabaseUserId!
    );

    sendCsv(res, "documents-audit.csv", csv);
  })
);

router.get(
  "/audit/documents",
  authenticate,
  validate(getAllDocumentsAuditSchema),
  asyncHandler(async (req, res) => {
    const { query } = getAllDocumentsAuditSchema.parse({
      query: req.query,
      params: req.params,
      body: req.body ?? {},
    });

    const history = await auditService.getAllDocumentsAuditHistory(
      req.supabaseUserId!,
      query.limit ?? 50
    );

    res.json({
      auditHistory: history,
    });
  })
);

router.get(
  "/documents/:id/audit/export",
  authenticate,
  validate(getAuditHistorySchema),
  asyncHandler(async (req, res) => {
    const documentId = req.params.id as string;
    const csv = await auditService.exportDocumentAuditCsv(
      documentId,
      req.supabaseUserId!
    );

    sendCsv(res, `document-audit-${documentId}.csv`, csv);
  })
);

router.get(
  "/documents/:id/audit",
  authenticate,
  validate(getAuditHistorySchema),
  asyncHandler(async (req, res) => {
    const history = await auditService.getDocumentAuditHistory(
      req.params.id as string,
      req.supabaseUserId!
    );

    res.json({
      auditHistory: history,
    });
  })
);

export default router;
