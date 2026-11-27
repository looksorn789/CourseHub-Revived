import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import PostService from "../../services/postService";
import { shrinkImage, IMAGE_LIMITS } from "../../utils/imageResize";

export const MAX_POST_IMAGES = 4; // same as the API (routes/post.py)
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Photo grid for a post card or the full post view. */
export function PostImageGrid({ images = [], className = "" }) {
  if (!images.length) return null;
  const single = images.length === 1;
  return (
    <div
      className={`grid gap-1.5 overflow-hidden rounded-xl ${single ? "grid-cols-1" : "grid-cols-2"} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {images.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          className={`block bg-gray-100 ${images.length === 3 && i === 0 ? "row-span-2" : ""}`}
        >
          <img
            src={url}
            alt={`Attachment ${i + 1} of ${images.length}`}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover ${single ? "max-h-96" : "aspect-square"}`}
          />
        </a>
      ))}
    </div>
  );
}

/**
 * Pick photos for a post. Existing photos (when editing) can be removed;
 * new files are previewed and uploaded by the parent after the post saves.
 *
 * value: { existing: string[], removed: string[], added: File[] }
 */
export function PostImagePicker({ value, onChange, disabled }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const urls = value.added.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [value.added]);

  const kept = value.existing.filter((u) => !value.removed.includes(u));
  const total = kept.length + value.added.length;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const room = MAX_POST_IMAGES - total;
    const ok = [];
    for (const picked of files) {
      if (!ACCEPTED_TYPES.includes(picked.type)) {
        setError("Use PNG, JPEG, WebP or GIF images.");
        continue;
      }
      // Shrink large photos first so they load fast (and fit the size limit).
      const file = await shrinkImage(picked, IMAGE_LIMITS.post);
      if (file.size > MAX_BYTES) {
        setError("Each photo must be 5 MB or smaller.");
        continue;
      }
      ok.push(file);
    }
    if (ok.length > room) setError(`A post can have up to ${MAX_POST_IMAGES} photos.`);
    else if (ok.length === files.length) setError("");
    if (ok.length && room > 0) onChange({ ...value, added: [...value.added, ...ok.slice(0, room)] });
  };

  const tile = "relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-50";
  const removeBtn =
    "absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80 disabled:opacity-50";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {kept.map((url) => (
          <div key={url} className={tile}>
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              disabled={disabled}
              className={removeBtn}
              onClick={() => onChange({ ...value, removed: [...value.removed, url] })}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {previews.map((url, i) => (
          <div key={url} className={tile}>
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              disabled={disabled}
              className={removeBtn}
              onClick={() => onChange({ ...value, added: value.added.filter((_, j) => j !== i) })}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {total < MAX_POST_IMAGES && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border border-dashed border-green-300 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            <ImagePlus className="mb-1 h-5 w-5" />
            Add photo
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        aria-label="Upload post photos"
        onChange={handleFiles}
      />
      <p className="text-xs text-gray-500">
        Up to {MAX_POST_IMAGES} photos, 5 MB each (PNG, JPEG, WebP, GIF).
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export const imageChangesFor = (images = []) => ({ existing: images, removed: [], added: [] });

/**
 * Apply picker changes to a saved post. Returns { images, errors } where
 * images is the post's photo list afterwards (null if nothing changed).
 */
export async function applyPostImageChanges(postId, changes) {
  if (!changes || (!changes.removed.length && !changes.added.length)) {
    return { images: null, errors: [] };
  }
  let images = changes.existing.filter((u) => !changes.removed.includes(u));
  const errors = [];
  for (const url of changes.removed) {
    const { data, error } = await PostService.removePostImage(postId, url);
    if (error) errors.push(error);
    else images = data.images;
  }
  for (const file of changes.added) {
    const { data, error } = await PostService.uploadPostImage(postId, file);
    if (error) errors.push(`${file.name}: ${error}`);
    else images = data.images;
  }
  return { images, errors };
}
