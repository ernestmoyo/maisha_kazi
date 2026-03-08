import sharp from "sharp";
import { AppError } from "../utils/AppError.js";

export const UploadService = {
  /**
   * Strip all EXIF/GPS metadata from an image and overwrite the file in place.
   */
  async stripExifAndSave(filePath: string): Promise<void> {
    const buffer = await sharp(filePath)
      .rotate() // auto-rotate based on EXIF orientation before stripping
      .toBuffer();

    await sharp(buffer).toFile(filePath);
  },

  /**
   * Validate that a file is actually a readable image using sharp metadata.
   */
  async validateImage(filePath: string): Promise<void> {
    try {
      const metadata = await sharp(filePath).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error("Missing image dimensions");
      }
    } catch {
      throw new AppError(
        "Uploaded file is not a valid image or is corrupted.",
        400
      );
    }
  },

  /**
   * Return the public URL path for a given uploaded filename.
   */
  getUploadUrl(filename: string): string {
    return `/uploads/${filename}`;
  },
};
