import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı",
  description: "Aradığınız sayfa bulunamadı. Kataloğa veya ana sayfaya dönerek gezinmeye devam edebilirsiniz.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFoundPage() {
  return (
    <section className="page-shell">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 md:px-8">
        <div className="panel text-center space-y-5">
          <p className="hero-kicker">404</p>
          <h1 className="section-title">Sayfa bulunamadı</h1>
          <p className="section-sub">
            Aradığınız içerik taşınmış, kaldırılmış veya hatalı bir bağlantı ile açılmış olabilir.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/" className="btn btn-primary">
              Ana Sayfaya Dön
            </Link>
            <Link href="/urunler" className="btn btn-secondary">
              Ürünleri İncele
            </Link>
            <Link href="/kargo-takip" className="btn btn-secondary">
              Kargo Takip
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
