import { absoluteUrl } from "@/lib/seo";

export default function CartHead() {
  return (
    <>
      <title>Sepetim | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Sepetindeki ürünleri kontrol et, miktarları güncelle ve ödeme adımına geç."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/sepet")} />
    </>
  );
}