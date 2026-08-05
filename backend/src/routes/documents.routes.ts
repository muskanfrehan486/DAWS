import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadDocument } from "../middleware/upload";
import { errors } from "../lib/errors";
import { documentsService } from "../services/documents.service";
import { createDocumentSchema, uploadVersionSchema } from "../schemas/documents.schema";

const router = Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const documents = await documentsService.getDocuments(
      req.supabaseUserId!
    );

    res.json(documents);
  })
);

router.post(
  "/",
  authenticate,
  uploadDocument.single("file"),
  (req, _res, next) => {
    try {
      if (req.body.approvalChain) {
        req.body.approvalChain = JSON.parse(req.body.approvalChain);
      }
      next();
    } catch {
      next(new Error("Invalid approvalChain JSON"));
    }
  },
  validate(createDocumentSchema),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new Error("Document PDF is required");
    }
    const result = await documentsService.createDocument(
      req.body,
      req.file,
      req.supabaseUserId!
    );
    res.status(201).json(result);
  })
);

router.post(
  "/:id/versions",
  authenticate,
  uploadDocument.single("file"),
  validate(uploadVersionSchema),

  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw errors.badRequest("Document PDF is required");
    }

    const result = await documentsService.uploadVersion(
      req.params.id as string,
      req.file,
      req.supabaseUserId!
    );

    res.status(201).json(result);
  })
);

export default router;