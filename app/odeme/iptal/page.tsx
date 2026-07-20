import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <section className="page-shell">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <article className="panel space-y-4">
          <h1 className="section-title">Ödeme İptal Edildi</h1>
          <p className="section-sub">
            Ödeme işlemi tamamlanmadı. Sepetiniz korunmuştur, tekrar deneyebilirsiniz.
          </p>
          <div className="flex gap-3">
            <Link href="/sepet" className="btn btn-primary">
              Sepete Dön
            </Link>
            <Link href="/urunler" className="btn btn-secondary">
              Ürünlere Git
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
