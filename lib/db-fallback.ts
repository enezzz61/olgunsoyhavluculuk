import type { Product } from "@/lib/products";

const mockProducts: Product[] = [
  {
    id: "mock-hv-100",
    sku: "HV-100",
    name: "Premium Banyo Havlusu 90x150",
    category: "Banyo",
    image: "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80",
    ],
    retailPrice: 399,
    stockCount: 48,
    stockStatus: "stokta",
    wholesaleEnabled: true,
    description: "Yuksek emicilik, yumusak dokulu ve otel segmentinde kullanima uygun.",
    wholesaleTiers: [
      { id: "mock-tier-1", productId: "mock-hv-100", minQty: 20, unitPrice: 309 },
      { id: "mock-tier-2", productId: "mock-hv-100", minQty: 60, unitPrice: 289 },
    ],
    active: true,
  },
  {
    id: "mock-hv-101",
    sku: "HV-101",
    name: "El Havlusu 50x90",
    category: "El Havlusu",
    image: "https://images.unsplash.com/photo-1616627457694-6fdf0e19631b?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1616627457694-6fdf0e19631b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=1200&q=80",
    ],
    retailPrice: 169,
    stockCount: 4,
    stockStatus: "az_stokta",
    wholesaleEnabled: true,
    description: "Gunluk kullanim icin hizli kuruyan, uzun omurlu pamuk yapisi.",
    wholesaleTiers: [{ id: "mock-tier-3", productId: "mock-hv-101", minQty: 30, unitPrice: 129 }],
    active: true,
  },
  {
    id: "mock-hv-103",
    sku: "HV-103",
    name: "Plaj Havlusu 100x170",
    category: "Plaj",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
    ],
    retailPrice: 549,
    stockCount: 0,
    stockStatus: "tukendi",
    wholesaleEnabled: false,
    description: "Genis olculu, renk korumali ve hizli kuruyan yaz koleksiyonu urunu.",
    wholesaleTiers: [],
    active: true,
  },
];

function normalizeMockProduct(product: Product): Product {
  return {
    ...product,
    stockCount: typeof product.stockCount === "number" ? Math.max(0, Math.floor(product.stockCount)) : 0,
    stockStatus: product.stockStatus || (product.stockCount === 0 ? "tukendi" : product.stockCount && product.stockCount <= 5 ? "az_stokta" : "stokta"),
  };
}

export function isDbUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes("prismaclientinitializationerror") ||
    message.includes("environment variable not found: database_url") ||
    message.includes("database_url") ||
    message.includes("error creating a database connection") ||
    message.includes("dns resolution") ||
    message.includes("can't reach database server") ||
    message.includes("connect") ||
    message.includes("server selection timeout") ||
    message.includes("no available servers")
  );
}

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.MONGODB_URI?.trim() ||
    process.env.MONGO_URL?.trim() ||
    process.env.MONGODB_URL?.trim() ||
    ""
  );
}

export function canUseMockData() {
  if (process.env.MOCK_DB === "true" || process.env.MOCK_DB === "1") {
    return true;
  }

  return false;
}

export function getMockProducts() {
  return mockProducts.map(normalizeMockProduct);
}

export function getMockProductById(id: string) {
  return mockProducts.find((product) => product.id === id) ?? null;
}

export function createMockProduct(product: Product) {
  const nextProduct = normalizeMockProduct(product);
  mockProducts.unshift(nextProduct);
  return nextProduct;
}

export function updateMockProduct(id: string, patch: Partial<Product>) {
  const index = mockProducts.findIndex((product) => product.id === id);
  if (index < 0) {
    return null;
  }

  const current = mockProducts[index];
  const nextProduct = normalizeMockProduct({
    ...current,
    ...patch,
    stockCount: typeof patch.stockCount === "number" ? patch.stockCount : current.stockCount,
  });

  mockProducts[index] = nextProduct;
  return nextProduct;
}

export function updateMockProductBySku(sku: string, patch: Partial<Product>) {
  const index = mockProducts.findIndex((product) => product.sku === sku);
  if (index < 0) {
    return null;
  }

  const current = mockProducts[index];
  const nextProduct = normalizeMockProduct({
    ...current,
    ...patch,
    stockCount: typeof patch.stockCount === "number" ? patch.stockCount : current.stockCount,
  });

  mockProducts[index] = nextProduct;
  return nextProduct;
}

export function deleteMockProduct(id: string) {
  const index = mockProducts.findIndex((product) => product.id === id);
  if (index < 0) {
    return false;
  }

  mockProducts.splice(index, 1);
  return true;
}
