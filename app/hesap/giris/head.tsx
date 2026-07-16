import { absoluteUrl } from "@/lib/seo";

export default function LoginHead() {
  return (
    <>
      <title>Giris Yap | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Hesabina giris yap, siparislerini takip et ve alisverisine kaldigin yerden devam et."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/hesap/giris")} />
    </>
  );
}