import type { Metadata } from "next";
import { ProductsPage } from "@/components/products-page";

export const metadata: Metadata = {
  title: "Urunler",
  description: "Perakende ve toptanci fiyatlariyla Olgunsoy Havluculuk urun katalogu.",
  alternates: {
    canonical: "/urunler",
  },
  openGraph: {
    title: "Olgunsoy Urun Katalogu",
    description: "Kategori bazli filtreleme ile havlu urunlerini incele, sepete ekle ve hizli alisveris yap.",
    url: "/urunler",
  },
};

export default function Products() {
  return <ProductsPage />;
}
