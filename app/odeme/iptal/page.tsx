import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <section className="page-shell">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <article className="panel space-y-4">
          <h1 className="section-title">Odeme Iptal Edildi</h1>
          <p className="section-sub">
            Odeme islemi tamamlanmadi. Sepetiniz korunmustur, tekrar deneyebilirsiniz.
          </p>
          <div className="flex gap-3">
            <Link href="/sepet" className="btn btn-primary">
              Sepete Don
            </Link>
            <Link href="/urunler" className="btn btn-secondary">
              Urunlere Git
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
