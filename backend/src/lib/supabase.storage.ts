import { supabaseAdmin } from "./supabase";
import { errors } from "./errors";

const BUCKET = "documents";

class StorageService {
  async uploadDocument(
    path: string,
    file: Express.Multer.File
  ): Promise<string> {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, file.buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) {
      throw errors.internal("Failed to upload document");
    }

    return path;
  }

  async deleteDocument(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([path]);

    if (error) {
      console.error(error);
    }
  }
}

export const storageService = new StorageService();