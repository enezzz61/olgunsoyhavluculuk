"use client";

import { useMemo } from "react";
import { useProductVariant } from "@/components/product-variant-context";

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

export function ProductVariantPalette() {
  const { images, activeIndex, setActiveIndex } = useProductVariant();

  const options = useMemo(
    () =>
      images.map((item, index) => ({
        index,
        label: item.label?.trim() || `Secenek ${index + 1}`,
        swatchColor: resolveSwatchColor(item.label?.trim() || ""),
      })),
    [images],
  );

  if (options.length <= 1) {
    return null;
  }

  const selected = options[activeIndex] || options[0];

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Renk</p>
        <p className="text-xs font-semibold text-slate-700">Secili: {selected?.label}</p>
      </div>
      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
        {options.map((option) => (
          <button
            key={`${option.label}-${option.index}`}
            type="button"
            onClick={() => setActiveIndex(option.index)}
            className={`relative h-8 w-8 shrink-0 rounded-full border-2 transition ${activeIndex === option.index ? "scale-110 border-slate-900" : "border-slate-300 hover:border-slate-500"}`}
            style={{ backgroundColor: option.swatchColor }}
            aria-pressed={activeIndex === option.index}
            aria-label={`Renk: ${option.label}`}
            title={option.label}
          >
            {activeIndex === option.index ? <span className="absolute inset-0 rounded-full ring-2 ring-slate-900/20" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
