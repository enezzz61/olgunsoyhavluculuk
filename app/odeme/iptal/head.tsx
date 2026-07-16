import { absoluteUrl } from "@/lib/seo";

export default function PaymentCancelHead() {
  return (
    <>
      <title>Odeme Iptal | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Odeme islemi iptal edildi. Sepetine donup tekrar deneyebilirsin."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/odeme/iptal")} />
    </>
  );
}