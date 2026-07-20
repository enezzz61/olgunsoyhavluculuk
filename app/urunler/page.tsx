import type { Metadata } from "next";
import { ProductsPage } from "@/components/products-page";

export const metadata: Metadata = {
  title: "Ürünler",
  description: "Perakende ve toptancı fiyatlarıyla Olgunsoy Havluculuk ürün kataloğu.",
  alternates: {
    canonical: "/urunler",
  },
  openGraph: {
    title: "Olgunsoy Ürün Kataloğu",
    description: "Kategori bazlı filtreleme ile havlu ürünlerini incele, sepete ekle ve hızlı alışveriş yap.",
    url: "/urunler",
  },
};

export default function Products() {
  return <ProductsPage />;
}
