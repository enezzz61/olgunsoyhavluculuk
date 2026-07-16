import { absoluteUrl } from "@/lib/seo";

export default function PaymentSuccessHead() {
  return (
    <>
      <title>Odeme Basarili | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Odeme sonucu ve siparis onay durumu."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/odeme/basarili")} />
    </>
  );
}