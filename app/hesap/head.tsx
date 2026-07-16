import { absoluteUrl } from "@/lib/seo";

export default function HesapHead() {
  return (
    <>
      <title>Hesabim | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Hesap bilgilerini, siparislerini ve profil ayarlarini yonet."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/hesap")} />
    </>
  );
}