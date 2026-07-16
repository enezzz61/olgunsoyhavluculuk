import { absoluteUrl } from "@/lib/seo";

export default function AdminHead() {
  return (
    <>
      <title>Admin Paneli | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Urunler, siparisler ve denetim kayitlari icin yonetim paneli."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/admin")} />
    </>
  );
}