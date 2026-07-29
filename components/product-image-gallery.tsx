"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getImageSource } from "@/lib/image-fallback";

type ProductImageGalleryProps = {
  images: string[];
  alt: string;
};

export function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const list = useMemo(() => Array.from(new Set(images.filter(Boolean))), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState({ visible: false, x: 50, y: 50 });
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  const activeImage = list[activeIndex] || list[0];
  const activeImageSrc = imageMap[activeImage] ?? getImageSource(activeImage);

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
            setImageMap((prev) => ({ ...prev, [activeImage]: getImageSource(activeImage, undefined, true) }));
          }}
        />
        {zoom.visible ? (
          <div
            className="zoom-layer"
            style={{
              backgroundImage: `url(${activeImage})`,
              backgroundPosition: `${zoom.x}% ${zoom.y}%`,
            }}
          />
        ) : null}
      </div>

      <div className="thumb-row">
        {list.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            className={`thumb-btn ${index === activeIndex ? "thumb-btn-active" : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Gorsel ${index + 1}`}
          >
            <Image
              src={imageMap[image] ?? getImageSource(image)}
              alt={`${alt} ${index + 1}`}
              width={120}
              height={120}
              className="thumb-image"
              unoptimized
              onError={() => {
                setImageMap((prev) => ({ ...prev, [image]: getImageSource(image, undefined, true) }));
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
