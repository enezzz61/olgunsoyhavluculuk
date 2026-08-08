"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type GalleryImageItem = {
  src: string;
  label?: string;
};

type ProductVariantContextValue = {
  images: GalleryImageItem[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
};

const ProductVariantContext = createContext<ProductVariantContextValue | null>(null);

type ProductVariantProviderProps = {
  images: GalleryImageItem[];
  children: React.ReactNode;
};

export function ProductVariantProvider({ images, children }: ProductVariantProviderProps) {
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

  const [activeIndex, setActiveIndexState] = useState(0);

  function setActiveIndex(index: number) {
    if (!list.length) {
      setActiveIndexState(0);
      return;
    }

    const safeIndex = Math.max(0, Math.min(index, list.length - 1));
    setActiveIndexState(safeIndex);
  }

  return (
    <ProductVariantContext.Provider value={{ images: list, activeIndex, setActiveIndex }}>
      {children}
    </ProductVariantContext.Provider>
  );
}

export function useProductVariant() {
  const context = useContext(ProductVariantContext);
  if (!context) {
    throw new Error("useProductVariant must be used within ProductVariantProvider");
  }

  return context;
}
