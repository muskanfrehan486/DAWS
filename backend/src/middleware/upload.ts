import multer from "multer";
import { errors } from "../lib/errors";

const storage = multer.memoryStorage();

export const SUPPORTING_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

export const MAX_SUPPORTING_FILES = 5;

const documentUploadFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.fieldname === "file") {
    if (file.mimetype !== "application/pdf") {
      return cb(errors.badRequest("Only PDF files are allowed for the main document"));
    }
    return cb(null, true);
  }

  if (file.fieldname === "supportingFiles") {
    if (!SUPPORTING_FILE_MIME_TYPES.has(file.mimetype)) {
      return cb(
        errors.badRequest(
          "Supporting files must be PDF, PNG, JPG, Word, Excel, TXT, or CSV"
        )
      );
    }
    return cb(null, true);
  }

  return cb(errors.badRequest("Unexpected file field"));
};

export const uploadDocument = multer({
  storage,
  fileFilter: documentUploadFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, //20MB
    files: 1 + MAX_SUPPORTING_FILES,
  },
});

/** Main PDF + optional supporting attachments. */
export const uploadDocumentWithSupporting = uploadDocument.fields([
  { name: "file", maxCount: 1 },
  { name: "supportingFiles", maxCount: MAX_SUPPORTING_FILES },
]);

const signatureFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!["image/png", "image/jpeg"].includes(file.mimetype)) {
    return cb(errors.badRequest("Only PNG or JPEG signature images are allowed"));
  }

  cb(null, true);
};

export const uploadSignature = multer({
  storage,
  fileFilter: signatureFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});
