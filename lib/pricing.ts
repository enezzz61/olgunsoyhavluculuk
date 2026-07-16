import type { Product, UserRole, WholesaleTier } from "@/lib/products";

export function getWholesaleTierPrice(
  tiers: WholesaleTier[] = [],
  qty: number,
): { unitPrice: number; minQty: number } | null {
  if (!tiers.length) {
    return null;
  }

  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  const matched = sorted.filter((tier) => qty >= tier.minQty).at(-1);

  if (matched) {
    return { unitPrice: matched.unitPrice, minQty: matched.minQty };
  }

  const first = sorted[0];
  return { unitPrice: first.unitPrice, minQty: first.minQty };
}

export function canUseWholesale(product: Product) {
  return product.wholesaleEnabled && (product.wholesaleTiers?.length || 0) > 0;
}

export function resolveUnitPrice(params: {
  product: Product;
  role: UserRole;
  qty: number;
}) {
  const { product, role, qty } = params;

  if (role !== "toptanci") {
    return { unitPrice: product.retailPrice, source: "retail" as const };
  }

  if (!canUseWholesale(product)) {
    return { unitPrice: product.retailPrice, source: "retail_fallback" as const };
  }

  const tier = getWholesaleTierPrice(product.wholesaleTiers || [], qty);
  if (!tier) {
    return { unitPrice: product.retailPrice, source: "retail_fallback" as const };
  }

  return {
    unitPrice: tier.unitPrice,
    source: "wholesale_tier" as const,
    minQty: tier.minQty,
  };
}
