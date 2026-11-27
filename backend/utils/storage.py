"""Image uploads to Supabase Storage (public buckets)."""
import uuid
from typing import Optional, Tuple

from flask import current_app
from storage3 import create_client as create_storage_client

CHANNEL_IMAGE_BUCKET = "channel-images"
POST_IMAGE_BUCKET = "post-images"


def storage_bucket(bucket: str):
    """Storage client for a bucket that always uses the service key.

    current_app.supabase also signs users in, after which it may send storage
    requests with that user's token instead, so it isn't used here.
    """
    url, key = current_app.config["SUPABASE_URL"], current_app.config["SUPABASE_KEY"]
    client = create_storage_client(
        f"{url}/storage/v1",
        {"apikey": key, "Authorization": f"Bearer {key}"},
        is_async=False,
    )
    return client.from_(bucket)


def detect_image(data: bytes) -> Optional[Tuple[str, str]]:
    """(mime type, extension) from the file's leading bytes, or None."""
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", "png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", "jpg"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif", "gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp", "webp"
    return None


def read_image_upload(upload, max_bytes: int) -> Tuple[Optional[Tuple[bytes, str, str]], Optional[str]]:
    """Validate an uploaded file. Returns ((data, mime, ext), None) or (None, error)."""
    if not upload:
        return None, "No file provided"
    data = upload.read(max_bytes + 1)
    if len(data) > max_bytes:
        return None, f"Image must be {max_bytes // (1024 * 1024)} MB or smaller"
    detected = detect_image(data)
    if not detected:
        return None, "Use a PNG, JPEG, WebP or GIF image"
    return (data, *detected), None


def upload_image(bucket: str, folder: str, prefix: str, image: Tuple[bytes, str, str]) -> str:
    """Upload validated image bytes and return the public URL."""
    data, mime, ext = image
    store = storage_bucket(bucket)
    path = f"{folder}/{prefix}-{uuid.uuid4().hex}.{ext}"
    store.upload(path, data, {"content-type": mime, "cache-control": "31536000"})
    return store.get_public_url(path).rstrip("?")


def stored_image_path(bucket: str, image_url: Optional[str]) -> Optional[str]:
    """Object path inside the bucket for a URL we created, else None."""
    marker = f"/storage/v1/object/public/{bucket}/"
    if image_url and marker in image_url:
        return image_url.split(marker, 1)[1].split("?", 1)[0]
    return None


def remove_images(bucket: str, image_urls) -> None:
    """Best-effort delete of images we stored (other URLs are ignored)."""
    paths = [p for p in (stored_image_path(bucket, u) for u in image_urls or []) if p]
    if not paths:
        return
    try:
        storage_bucket(bucket).remove(paths)
    except Exception as e:
        current_app.logger.warning(f"Could not delete images {paths}: {e}")
