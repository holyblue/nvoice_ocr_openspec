"""
Image utility functions: base64 validation, resize, format validation.
"""

import base64
import io
from typing import Optional
from PIL import Image


ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "BMP", "TIFF"}
MAX_DIMENSION = 2048  # pixels
JPEG_QUALITY = 85


def validate_base64_image(b64_string: str) -> bool:
    """Return True if the string is valid base64-encoded image data."""
    try:
        data = base64.b64decode(b64_string, validate=True)
        img = Image.open(io.BytesIO(data))
        return img.format in ALLOWED_FORMATS
    except Exception:
        return False


def get_image_format(b64_string: str) -> Optional[str]:
    """Return the image format string (e.g. 'JPEG') or None."""
    try:
        data = base64.b64decode(b64_string)
        img = Image.open(io.BytesIO(data))
        return img.format
    except Exception:
        return None


def resize_image_base64(b64_string: str, max_dim: int = MAX_DIMENSION) -> str:
    """
    Resize image so that neither dimension exceeds max_dim.
    Returns a base64-encoded JPEG string.
    """
    data = base64.b64decode(b64_string)
    img = Image.open(io.BytesIO(data))

    # Convert to RGB if needed (for JPEG output)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    width, height = img.size
    if width > max_dim or height > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=JPEG_QUALITY)
    return base64.b64encode(buf.getvalue()).decode()


def save_base64_image(b64_string: str, file_path: str) -> None:
    """Save a base64-encoded image to disk."""
    import os
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    data = base64.b64decode(b64_string)
    with open(file_path, "wb") as f:
        f.write(data)
