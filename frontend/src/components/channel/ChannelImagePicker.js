import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { forumService } from "../../services/forumService";

// Shown when a channel has no custom image.
export const DEFAULT_CHANNEL_BANNER =
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&h=400&q=80";
export const DEFAULT_CHANNEL_ICON =
  "https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=200&h=200&q=80";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
// Same limits as the API (backend/routes/forum.py CHANNEL_IMAGE_KINDS).
const MAX_BYTES = { avatar: 2 * 1024 * 1024, banner: 5 * 1024 * 1024 };

/**
 * Pick, preview and remove a channel icon ("avatar") or banner.
 * The parent keeps the chosen file and uploads it on save via
 * applyChannelImageChanges().
 *
 * value: { file: File|null, removed: boolean }
 */
export function ChannelImagePicker({ kind, label, currentUrl, value, onChange, disabled }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!value.file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(value.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value.file]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Use a PNG, JPEG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES[kind]) {
      setError(`Image must be ${MAX_BYTES[kind] / (1024 * 1024)} MB or smaller.`);
      return;
    }
    setError("");
    onChange({ file, removed: false });
  };

  const shown = preview || (!value.removed && currentUrl) || null;
  const isBanner = kind === "banner";

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="flex items-center gap-3">
        <div
          className={`relative shrink-0 overflow-hidden border border-dashed border-green-300 bg-green-50 ${
            isBanner ? "h-16 w-40 rounded-lg" : "h-16 w-16 rounded-full"
          }`}
        >
          {shown ? (
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[11px] text-green-700">
              Default
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            <ImagePlus className="mr-1.5 h-4 w-4" />
            {shown ? "Change" : "Upload"}
          </button>
          {shown && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setError("");
                onChange({ file: null, removed: Boolean(currentUrl) });
              }}
              className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={handleFile}
          aria-label={`Upload ${label}`}
        />
      </div>
      <p className="text-xs text-gray-500">
        PNG, JPEG, WebP or GIF, up to {MAX_BYTES[kind] / (1024 * 1024)} MB
        {isBanner ? " (wide images look best)" : ""}.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export const emptyImageChange = () => ({ file: null, removed: false });

/**
 * Upload/remove the picked images for a channel.
 * Returns { urls: { avatar_url?, banner_url? }, errors: string[] }.
 */
export async function applyChannelImageChanges(forumId, changes) {
  const urls = {};
  const errors = [];
  for (const [kind, field, label] of [
    ["avatar", "avatar_url", "icon"],
    ["banner", "banner_url", "banner"],
  ]) {
    const change = changes[kind];
    if (!change) continue;
    if (change.file) {
      const { data, error } = await forumService.uploadForumImage(forumId, kind, change.file);
      if (error) errors.push(`Channel ${label}: ${error}`);
      else urls[field] = data[field];
    } else if (change.removed) {
      const { error } = await forumService.removeForumImage(forumId, kind);
      if (error) errors.push(`Channel ${label}: ${error}`);
      else urls[field] = null;
    }
  }
  return { urls, errors };
}
