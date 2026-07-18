import { absoluteUrl } from "@/lib/seo";

export default function PaymentHead() {
  return (
    <>
      <title>Odeme | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Siparis odeme adimlari sadece giris yapan kullanicilar icindir."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/odeme")} />
    </>
  );
}
