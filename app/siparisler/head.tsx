import { absoluteUrl } from "@/lib/seo";

export default function OrdersHead() {
  return (
    <>
      <title>Siparislerim | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Gecmis siparislerini ve durumlarini tek ekrandan takip et."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/siparisler")} />
    </>
  );
}