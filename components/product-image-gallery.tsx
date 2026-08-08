"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getImageSource } from "@/lib/image-fallback";

type GalleryImageItem = {
  src: string;
  label?: string;
};

type ProductImageGalleryProps = {
  images: GalleryImageItem[];
  alt: string;
};

export function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const list = useMemo(() => {
    const unique = new Map<string, GalleryImageItem>();
    for (const item of images) {
      const src = String(item?.src || "").trim();
      if (!src) {
        continue;
      }

      if (!unique.has(src)) {
        unique.set(src, {
          src,
          label: item.label?.trim() || undefined,
        });
      }
    }

    return Array.from(unique.values());
  }, [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState({ visible: false, x: 50, y: 50 });
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  const variantOptions = useMemo(
    () =>
      list
        .map((item, index) => ({
          index,
          label: item.label,
        }))
        .filter((item): item is { index: number; label: string } => Boolean(item.label)),
    [list],
  );

  const activeImage = list[activeIndex] || list[0];
  const activeImageSrc = imageMap[activeImage.src] ?? getImageSource(activeImage.src);

  if (!activeImage) {
    return null;
  }

  return (
    <div className="space-y-3">
      {variantOptions.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Renk:</span>
          {variantOptions.map((variant) => (
            <button
              key={`${variant.label}-${variant.index}`}
              type="button"
              onClick={() => setActiveIndex(variant.index)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${activeIndex === variant.index ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"}`}
              aria-pressed={activeIndex === variant.index}
            >
              {variant.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="zoom-stage"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          setZoom({ visible: true, x, y });
        }}
        onMouseLeave={() => setZoom((prev) => ({ ...prev, visible: false }))}
      >
        <Image
          src={activeImageSrc}
          alt={alt}
          width={1000}
          height={1000}
          className="detail-image"
          priority
          unoptimized
          onError={() => {
            setImageMap((prev) => ({ ...prev, [activeImage.src]: getImageSource(activeImage.src, undefined, true) }));
          }}
        />
        {zoom.visible ? (
          <div
            className="zoom-layer"
            style={{
              backgroundImage: `url(${activeImageSrc})`,
              backgroundPosition: `${zoom.x}% ${zoom.y}%`,
            }}
          />
        ) : null}
      </div>

      <div className="thumb-row">
        {list.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            className={`thumb-btn ${index === activeIndex ? "thumb-btn-active" : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={image.label ? `Renk: ${image.label}` : `Gorsel ${index + 1}`}
          >
            <Image
              src={imageMap[image.src] ?? getImageSource(image.src)}
              alt={image.label ? `${alt} ${image.label}` : `${alt} ${index + 1}`}
              width={120}
              height={120}
              className="thumb-image"
              unoptimized
              onError={() => {
                setImageMap((prev) => ({ ...prev, [image.src]: getImageSource(image.src, undefined, true) }));
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
