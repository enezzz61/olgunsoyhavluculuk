export type UserRole = "perakende" | "toptanci";

export type WholesaleTier = {
  id: string;
  productId: string;
  minQty: number;
  unitPrice: number;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  image: string;
  gallery?: string[] | string;
  retailPrice: number;
  stockStatus?: string;
  stockCount?: number;
  wholesaleEnabled: boolean;
  description: string;
  wholesaleTiers?: WholesaleTier[];
  active?: boolean;
};
