import { absoluteUrl } from "@/lib/seo";

export default function OrdersHead() {
  return (
    <>
      <title>Siparişlerim | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Geçmiş siparişlerinizi ve durumlarını tek ekrandan takip et."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/siparisler")} />
    </>
  );
}