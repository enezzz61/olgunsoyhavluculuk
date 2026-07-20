import { absoluteUrl } from "@/lib/seo";

export default function RegisterHead() {
  return (
    <>
      <title>Kayıt Ol | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Perakende veya toptancı hesabını oluştur, fiyatları rolüne göre gör."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/hesap/kayit")} />
    </>
  );
}