import io
import warnings
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import HTTPException, UploadFile
from app.config import MAX_UPLOAD_BYTES

Image.MAX_IMAGE_PIXELS = 20_000_000

async def validated_image(file: UploadFile):
    if file.content_type not in {'image/jpeg','image/png','image/webp'}:
        raise HTTPException(415, detail={'code':'unsupported_image','message':'Choose a JPG, PNG, or WebP image.'})
    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, detail={'code':'image_too_large','message':'Choose an image smaller than 8 MB.'})
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(raw)) as test:
                if test.format not in {'JPEG','PNG','WEBP'} or getattr(test, 'n_frames', 1) != 1:
                    raise ValueError('Unsupported or animated image')
                if test.width * test.height > 20_000_000:
                    raise ValueError('Image resolution exceeds 20 megapixels')
                test.verify()
            with Image.open(io.BytesIO(raw)) as image:
                image = ImageOps.exif_transpose(image).convert('RGB')
                image.thumbnail((2048,2048))
                output = io.BytesIO()
                image.save(output, format='JPEG', quality=90)
                return output.getvalue()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombWarning, Image.DecompressionBombError):
        raise HTTPException(422, detail={'code':'invalid_image','message':'This image is unreadable, animated, or too large in resolution. Use a still image up to 20 megapixels.'})
