import { Suspense } from "react";
import { AuthPage } from "@/components/auth-page";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="page-shell">
          <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
            <div className="panel mx-auto max-w-xl space-y-4">
              <p className="hero-kicker">Hos Geldin</p>
              <h1 className="section-title">Giris Yap</h1>
              <p className="section-sub">Sayfa yukleniyor...</p>
            </div>
          </div>
        </section>
      }
    >
      <AuthPage
        mode="user"
        title="Giris Yap"
        kicker="Hos Geldin"
        description="Hesabina giris yaparak sepetini ve siparislerini yonet."
        defaultNext="/hesap"
        ctaHref="/hesap/kayit"
        ctaLabel="Kayit ol"
        alternateHref="/siparisler"
        alternateLabel="Siparislerim"
        demoTitle="Demo Hesaplar"
        demoLines={[
          "Perakende: perakende@olgunsoy.com / 123456",
          "Toptanci: toptanci@olgunsoy.com / 123456",
        ]}
      />
    </Suspense>
  );
}
