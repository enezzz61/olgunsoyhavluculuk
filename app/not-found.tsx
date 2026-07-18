import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadi",
  description: "Aradiginiz sayfa bulunamadi. Kataloga veya ana sayfaya donerek gezinmeye devam edebilirsiniz.",
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
          <h1 className="section-title">Sayfa bulunamadi</h1>
          <p className="section-sub">
            Aradiginiz icerik tasinmis, kaldirilmis veya hatali bir baglanti ile acilmis olabilir.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/" className="btn btn-primary">
              Ana Sayfaya Don
            </Link>
            <Link href="/urunler" className="btn btn-secondary">
              Urunleri Incele
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
