import { Suspense } from "react";
import { AuthPage } from "@/components/auth-page";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <section className="page-shell">
          <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
            <article className="panel space-y-4">
              <p className="hero-kicker">Yonetim Girişi</p>
              <h1 className="section-title">Admin Girişi</h1>
              <p className="section-sub">Sayfa yukleniyor...</p>
            </article>
          </div>
        </section>
      }
    >
      <AuthPage
        mode="admin"
        title="Admin Girişi"
        kicker="Yonetim Girişi"
        description="Admin paneline girmek için yöneticin hesabıyla oturum aç."
        defaultNext="/admin"
        ctaHref="/hesap/giris"
        ctaLabel="Normal girise don"
        alternateHref="/admin"
        alternateLabel="Admin paneline don"
      />
    </Suspense>
  );
}