import multer from "multer";
import { errors } from "../lib/errors";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(errors.badRequest("Only PDF files are allowed"));
  }

  cb(null, true);
};

export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, //20MB
  },
});

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