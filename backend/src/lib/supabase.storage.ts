import { supabaseAdmin } from "./supabase";
import { errors } from "./errors";

const DOCUMENTS_BUCKET = "documents";
const SIGNATURES_BUCKET = "signatures";

class StorageService {
  async uploadDocument(
    path: string,
    file: Express.Multer.File
  ): Promise<string> {
    const { error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file.buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) {
      throw errors.internal("Failed to upload document");
    }

    return path;
  }

  async uploadFile(
    path: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const { error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw errors.internal("Failed to upload file");
    }

    return path;
  }

  async downloadDocument(path: string): Promise<Buffer> {
    const { data, error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .download(path);

    if (error || !data) {
      throw errors.internal("Failed to download document");
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async overwriteDocument(path: string, buffer: Buffer): Promise<string> {
    // Remove first so we always update the same object instead of creating siblings.
    await supabaseAdmin.storage.from(DOCUMENTS_BUCKET).remove([path]);

    const { error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      throw errors.internal("Failed to save signed document");
    }

    return path;
  }

  async deleteDocument(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .remove([path]);

    if (error) {
      console.error(error);
    }
  }

  async uploadSignature(
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await supabaseAdmin.storage.from(SIGNATURES_BUCKET).remove([path]);

    const { error } = await supabaseAdmin.storage
      .from(SIGNATURES_BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw errors.internal("Failed to upload signature");
    }

    return path;
  }

  async downloadSignature(path: string): Promise<Buffer> {
    const { data, error } = await supabaseAdmin.storage
      .from(SIGNATURES_BUCKET)
      .download(path);

    if (error || !data) {
      throw errors.internal("Failed to download signature");
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async deleteSignature(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(SIGNATURES_BUCKET)
      .remove([path]);

    if (error) {
      console.error(error);
    }
  }

  getSignatureContentType(path: string): string {
    return path.endsWith(".jpg") || path.endsWith(".jpeg")
      ? "image/jpeg"
      : "image/png";
  }
}

export const storageService = new StorageService();
