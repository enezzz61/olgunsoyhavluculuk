import { absoluteUrl } from "@/lib/seo";

export default function LoginHead() {
  return (
    <>
      <title>Giriş Yap | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Hesabına giriş yap, siparişlerini takip et ve alışverişine kaldığın yerden devam et."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/hesap/giris")} />
    </>
  );
}