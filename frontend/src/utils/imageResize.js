/**
 * Shrink a photo in the browser before uploading it, so a several-MB phone
 * photo becomes a few hundred KB (faster uploads and faster page loads).
 *
 * - Images already within maxWidth x maxHeight and under ~1 MB are kept as is.
 * - GIFs are kept as is (resizing would drop the animation).
 * - Output is WebP when the browser can encode it, otherwise JPEG; PNGs with
 *   transparency stay PNG only if WebP isn't available.
 * Returns a File (the original one if nothing was changed or anything fails).
 */
export async function shrinkImage(file, { maxWidth, maxHeight = maxWidth, quality = 0.85 } = {}) {
  if (!file || file.type === "image/gif" || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    if (scale === 1 && file.size <= 1024 * 1024) {
      bitmap.close?.();
      return file;
    }
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const toBlob = (type) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    let blob = await toBlob("image/webp");
    if (!blob || blob.type !== "image/webp") {
      blob = await toBlob(file.type === "image/png" ? "image/png" : "image/jpeg");
    }
    // Oversized images are always resized; same-size ones only if it saves bytes.
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;
    const ext = { "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg" }[blob.type] || "img";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    return new File([blob], name, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  }
}

// Target sizes per use.
export const IMAGE_LIMITS = {
  avatar: { maxWidth: 512 },
  banner: { maxWidth: 1600, maxHeight: 900 },
  post: { maxWidth: 2000 },
};
