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

const COLOR_LOOKUP: Array<{ names: string[]; value: string }> = [
  { names: ["beyaz", "white"], value: "#ffffff" },
  { names: ["siyah", "black"], value: "#121212" },
  { names: ["mavi", "blue", "lacivert", "navy"], value: "#2563eb" },
  { names: ["kirmizi", "kırmızı", "red", "bordo"], value: "#dc2626" },
  { names: ["yesil", "yeşil", "green", "haki"], value: "#16a34a" },
  { names: ["sari", "sarı", "yellow", "gold"], value: "#eab308" },
  { names: ["turuncu", "orange"], value: "#f97316" },
  { names: ["mor", "purple"], value: "#7c3aed" },
  { names: ["pembe", "pink", "fuşya", "fusya"], value: "#ec4899" },
  { names: ["gri", "gray", "grey", "antrasit"], value: "#6b7280" },
  { names: ["bej", "krem", "ivory"], value: "#d6c8a8" },
  { names: ["kahverengi", "brown", "taba"], value: "#8b5e3c" },
];

function normalizeColorName(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ç/g, "c");
}

function resolveSwatchColor(label: string) {
  const normalized = normalizeColorName(label);
  const matched = COLOR_LOOKUP.find((entry) => entry.names.some((name) => normalized.includes(name)));
  return matched?.value || "#94a3b8";
}

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
      list.map((item, index) => ({
        index,
        label: item.label?.trim() || `Secenek ${index + 1}`,
        swatchColor: resolveSwatchColor(item.label?.trim() || ""),
      })),
    [list],
  );

  const activeImage = list[activeIndex] || list[0];
  const activeImageSrc = imageMap[activeImage.src] ?? getImageSource(activeImage.src);

  if (!activeImage) {
    return null;
  }

  return (
    <div className="space-y-3">
      {variantOptions.length > 1 ? (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">Renk:</span>
          {variantOptions.map((variant) => (
            <button
              key={`${variant.label}-${variant.index}`}
              type="button"
              onClick={() => setActiveIndex(variant.index)}
              className={`relative h-8 w-8 shrink-0 rounded-full border-2 transition ${activeIndex === variant.index ? "scale-110 border-slate-900" : "border-slate-300 hover:border-slate-500"}`}
              style={{ backgroundColor: variant.swatchColor }}
              aria-pressed={activeIndex === variant.index}
              aria-label={`Renk: ${variant.label}`}
              title={variant.label}
            >
              {activeIndex === variant.index ? <span className="absolute inset-0 rounded-full ring-2 ring-slate-900/20" /> : null}
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

      {variantOptions.length <= 1 ? (
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
      ) : null}
    </div>
  );
}
