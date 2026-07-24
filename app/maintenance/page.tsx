import Link from "next/link";

export default function MaintenancePage() {
  return (
    <section className="page-shell">
      <div className="mx-auto max-w-2xl px-4 py-20 md:px-8">
        <div className="panel space-y-4 text-center">
          <p className="hero-kicker">Sistem Durumu</p>
          <h1 className="section-title">Bağlantı Sağlanamadı</h1>
          <p className="section-sub">
            MongoDB bağlantısı sağlanamadığı için site şu anda kullanılamıyor. Lütfen veritabanı bağlantısını kontrol edin.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link href="/" className="btn btn-primary">Ana Sayfaya Dön</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
