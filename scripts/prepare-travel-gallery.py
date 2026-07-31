#!/usr/bin/env python3
"""Convert incoming HEIC/JPEG/PNG photos, omit visual duplicates, and build responsive site assets."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps


def perceptual_hash(image: Image.Image) -> int:
    grayscale = ImageOps.exif_transpose(image).convert("L").resize((32, 32), Image.Resampling.LANCZOS)
    block = cv2.dct(np.asarray(grayscale, dtype=np.float32))[:8, :8]
    threshold = np.median(block.flatten()[1:])
    bits = (block > threshold).flatten()[1:]
    return sum(int(bit) << index for index, bit in enumerate(bits))


def hamming_distance(left: int, right: int) -> int:
    return (left ^ right).bit_count()


def to_rgb(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    if image.mode in ("RGBA", "LA"):
        background = Image.new("RGB", image.size, "white")
        background.paste(image, mask=image.getchannel("A"))
        return background
    return image.convert("RGB")


def resize(image: Image.Image, maximum: int) -> Image.Image:
    result = image.copy()
    result.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--gallery-module", type=Path, required=True)
    parser.add_argument("--gallery-json", type=Path, required=True)
    args = parser.parse_args()

    files = sorted(path for path in args.input.iterdir() if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png"})
    unique: list[tuple[Path, int]] = []
    discarded: list[str] = []
    for path in files:
        with Image.open(path) as image:
            current_hash = perceptual_hash(image)
        if any(hamming_distance(current_hash, known_hash) <= 5 for _, known_hash in unique):
            discarded.append(path.name)
            continue
        unique.append((path, current_hash))

    args.output.mkdir(parents=True, exist_ok=True)
    generated = []
    for index, (path, _) in enumerate(unique, start=1):
        stem = f"travel-{index:03d}"
        with Image.open(path) as source:
            image = to_rgb(source)
        primary = resize(image, 1600)
        primary.save(args.output / f"{stem}.jpg", "JPEG", quality=88, optimize=True, progressive=True)
        for width in (480, 960):
            variant = resize(image, width)
            variant.save(args.output / f"{stem}-{width}.webp", "WEBP", quality=82, method=6)
        orientation = "landscape" if primary.width > primary.height else "portrait" if primary.height > primary.width else "square"
        generated.append({
            "index": index,
            "source": path.name,
            "src": f"/images/travel-gallery-2026/{stem}.jpg",
            "width": primary.width,
            "height": primary.height,
            "orientation": orientation,
            "alt": f"Kyrgyzstan travel photo {index}: local landscapes, nomadic culture, and outdoor adventure",
        })

    args.manifest.write_text(json.dumps({"kept": generated, "discarded": discarded}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    gallery_items = [
        {key: item[key] for key in ("src", "alt", "orientation", "width", "height")}
        for item in generated
    ]
    lines = [
        "import type { GalleryItem } from './gallery';",
        "",
        "export const generatedGalleryItems: GalleryItem[] = " + json.dumps(gallery_items, ensure_ascii=False, indent=2) + ";",
        "",
        "export const generatedGalleryPreviewItems = generatedGalleryItems.filter((_, index) => [0, 4, 9, 15, 20, 25, 33, 40, 52].includes(index));",
        "",
    ]
    args.gallery_module.parent.mkdir(parents=True, exist_ok=True)
    args.gallery_module.write_text("\n".join(lines), encoding="utf-8")
    args.gallery_json.parent.mkdir(parents=True, exist_ok=True)
    args.gallery_json.write_text(json.dumps([item["src"] for item in generated], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(generated)} unique photos; discarded {len(discarded)} visual duplicates.")


if __name__ == "__main__":
    main()
