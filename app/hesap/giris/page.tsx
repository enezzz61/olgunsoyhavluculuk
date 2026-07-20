import { Suspense } from "react";
import { AuthPage } from "@/components/auth-page";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="page-shell">
          <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
            <div className="panel mx-auto max-w-xl space-y-4">
              <p className="hero-kicker">Hoş Geldiniz</p>
              <h1 className="section-title">Giriş Yap</h1>
              <p className="section-sub">Sayfa yükleniyor...</p>
            </div>
          </div>
        </section>
      }
    >
      <AuthPage
        mode="user"
        title="Giriş Yap"
        kicker="Hoş Geldiniz"
        description="Hesabına giriş yaparak sepetini ve siparişlerini yönet."
        defaultNext="/hesap"
        ctaHref="/hesap/kayit"
        ctaLabel="Kayıt ol"
        alternateHref="/siparisler"
        alternateLabel="Siparişlerim"
        demoTitle="Demo Hesaplar"
        demoLines={[
          "Perakende: perakende@olgunsoy.com / 123456",
          "Toptancı: toptanci@olgunsoy.com / 123456",
        ]}
      />
    </Suspense>
  );
}
