import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadDocument } from "../middleware/upload";
import { documentsService } from "../services/documents.service";
import {
  updateDocumentSchema,
  createDocumentSchema,
} from "../schemas/documents.schema";

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

router.get(
  "/:id/file",
  authenticate,
  asyncHandler(async (req, res) => {
    const { buffer, fileName } = await documentsService.getDocumentFile(
      req.params.id as string,
      req.supabaseUserId!
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.send(buffer);
  })
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const document = await documentsService.getDocumentById(
      req.params.id as string,
      req.supabaseUserId!
    );

    res.json(document);
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

router.patch(
  "/:id",
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
  validate(updateDocumentSchema),
  asyncHandler(async (req, res) => {
    const result = await documentsService.updateDocument(
      req.params.id as string,
      req.body,
      req.file,
      req.supabaseUserId!
    );

    res.json(result);
  })
);

export default router;