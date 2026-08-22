import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadDocumentWithSupporting } from "../middleware/upload";
import { documentsService } from "../services/documents.service";
import {
  updateDocumentSchema,
  createDocumentSchema,
} from "../schemas/documents.schema";

const router = Router();

function getUploadedFiles(req: Express.Request): {
  mainFile?: Express.Multer.File;
  supportingFiles: Express.Multer.File[];
} {
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  return {
    mainFile: files?.file?.[0],
    supportingFiles: files?.supportingFiles ?? [],
  };
}

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
  "/pending-count",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await documentsService.getPendingApprovalCount(
      req.supabaseUserId!
    );
    res.json(result);
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
  "/:id/supporting/:attachmentId/file",
  authenticate,
  asyncHandler(async (req, res) => {
    const { buffer, fileName, contentType } =
      await documentsService.getSupportingDocumentFile(
        req.params.id as string,
        req.params.attachmentId as string,
        req.supabaseUserId!
      );

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(fileName)}"`
    );
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
  uploadDocumentWithSupporting,
  (req, _res, next) => {
    try {
      if (req.body.approvalChain) {
        req.body.approvalChain = JSON.parse(req.body.approvalChain);
      }
      if (req.body.signature) {
        req.body.signature = JSON.parse(req.body.signature);
      }
      next();
    } catch {
      next(new Error("Invalid approvalChain or signature JSON"));
    }
  },
  validate(createDocumentSchema),
  asyncHandler(async (req, res) => {
    const { mainFile, supportingFiles } = getUploadedFiles(req);
    if (!mainFile) {
      throw new Error("Document PDF is required");
    }
    const result = await documentsService.createDocument(
      req.body,
      mainFile,
      req.supabaseUserId!,
      supportingFiles
    );
    res.status(201).json(result);
  })
);

router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await documentsService.deleteDocument(
      req.params.id as string,
      req.supabaseUserId!
    );

    res.json(result);
  })
);

router.patch(
  "/:id",
  authenticate,
  uploadDocumentWithSupporting,
  (req, _res, next) => {
    try {
      if (req.body.approvalChain) {
        req.body.approvalChain = JSON.parse(req.body.approvalChain);
      }
      if (req.body.signature) {
        req.body.signature = JSON.parse(req.body.signature);
      }
      next();
    } catch {
      next(new Error("Invalid approvalChain or signature JSON"));
    }
  },
  validate(updateDocumentSchema),
  asyncHandler(async (req, res) => {
    const { mainFile, supportingFiles } = getUploadedFiles(req);
    const result = await documentsService.updateDocument(
      req.params.id as string,
      req.body,
      mainFile,
      req.supabaseUserId!,
      supportingFiles
    );

    res.json(result);
  })
);

export default router;
