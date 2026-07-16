export type StockStatus = "stokta" | "az_stokta" | "tukendi";

const stockStatusLabel: Record<StockStatus, string> = {
  stokta: "Stokta",
  az_stokta: "Az Stok",
  tukendi: "Tukendi",
};

const stockStatusClass: Record<StockStatus, string> = {
  stokta: "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700",
  az_stokta: "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700",
  tukendi: "rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700",
};

export function normalizeStockStatus(value?: string | null): StockStatus {
  if (value === "az_stokta" || value === "tukendi") {
    return value;
  }

  return "stokta";
}

export function getStockStatusLabel(value?: string | null) {
  return stockStatusLabel[normalizeStockStatus(value)];
}

export function getStockStatusClass(value?: string | null) {
  return stockStatusClass[normalizeStockStatus(value)];
}

export function getStockCountLabel(stockCount?: number | null) {
  if (typeof stockCount !== "number" || Number.isNaN(stockCount)) {
    return "Stok bilgisi yok";
  }

  if (stockCount <= 0) {
    return "Tukendi";
  }

  if (stockCount <= 5) {
    return `Az stok (${stockCount})`;
  }

  return `Stokta (${stockCount})`;
}

export function isOutOfStock(stockCount?: number | null) {
  return typeof stockCount === "number" && stockCount <= 0;
}
