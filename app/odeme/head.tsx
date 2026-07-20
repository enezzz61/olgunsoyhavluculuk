import { absoluteUrl } from "@/lib/seo";

export default function PaymentHead() {
  return (
    <>
      <title>Ödeme | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Sipariş ödeme adımları sadece giriş yapan kullanıcılar içindir."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/odeme")} />
    </>
  );
}
