import { absoluteUrl } from "@/lib/seo";

export default function CartHead() {
  return (
    <>
      <title>Sepetim | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Sepetindeki urunleri kontrol et, miktarlari guncelle ve odeme adimina gec."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/sepet")} />
    </>
  );
}