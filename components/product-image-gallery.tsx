"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getImageSource } from "@/lib/image-fallback";
import { useProductVariant, type GalleryImageItem } from "@/components/product-variant-context";

type ProductImageGalleryProps = {
  images: GalleryImageItem[];
  alt: string;
};

export function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const { images: variantImages, activeIndex, setActiveIndex } = useProductVariant();
  const list = useMemo(() => (variantImages.length ? variantImages : images), [images, variantImages]);
  const [localActiveIndex, setLocalActiveIndex] = useState(0);
  const [zoom, setZoom] = useState({ visible: false, x: 50, y: 50 });
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  const selectedIndex = variantImages.length ? activeIndex : localActiveIndex;
  const activeImage = list[selectedIndex] || list[0];
  const activeImageSrc = imageMap[activeImage.src] ?? getImageSource(activeImage.src);

  function handleSelect(index: number) {
    if (variantImages.length) {
      setActiveIndex(index);
      return;
    }

    setLocalActiveIndex(index);
  }

  if (!activeImage) {
    return null;
  }

  return (
    <div className="space-y-3">
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

      {list.length <= 1 ? (
        <div className="thumb-row">
          {list.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              className={`thumb-btn ${index === selectedIndex ? "thumb-btn-active" : ""}`}
              onClick={() => handleSelect(index)}
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
