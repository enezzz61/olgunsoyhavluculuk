"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LegalDocumentTrigger } from "@/components/legal-document-trigger";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const paymentBadge = { src: "/payments/footer.png", alt: "Desteklenen ödeme yöntemleri" };

  async function submitNewsletter(e: FormEvent) {
    e.preventDefault();
    setMessage("Kayit aliniyor...");

    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "footer" }),
    });

    const data = (await response.json()) as { ok: boolean; message: string };
    setMessage(data.message);

    if (response.ok && data.ok) {
      setEmail("");
    }
  }

  return (
    <footer className="mt-10 border-t border-white/30 bg-gradient-to-r from-[#0f233a] via-[#16314e] to-[#183c5e] text-white/90">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 text-sm md:grid-cols-4 md:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/90">Olgunsoy Havluculuk</p>
          <p className="mt-2 text-white/80">Toptancı ve perakende havlu operasyonunu dijitalde hızlandıran modern sipariş platformu.</p>
          <p className="mt-3 text-xs text-white/60">Kampanya, yeni ürün ve sezonluk teklif duyuruları e-posta ile iletilir.</p>
        </div>

        <div>
          <p className="font-semibold">Menüler</p>
          <div className="mt-2 flex flex-col gap-1 text-white/80">
            <Link href="/">Ana Sayfa</Link>
            <Link href="/urunler">Ürünler</Link>
            <Link href="/hakkimizda">Hakkımızda</Link>
            <Link href="/hesap/giris">Giriş Yap</Link>
            <Link href="/hesap/kayit">Kayıt Ol</Link>
            <LegalDocumentTrigger
              label="Yasal Sözleşmeler"
              className="text-left"
            />
          </div>
        </div>

        <div>
          <p className="font-semibold">İletişim</p>
          <p className="mt-2 text-white/75">Toptan satış, otel projeleri ve özel üretim talepleri için bize ulaşabilirsiniz.</p>
          <p className="mt-2 text-white/75">E-posta: destek@olgunsoyhavluculuk.com</p>
          <div className="mt-3 flex flex-col gap-1 text-xs text-cyan-100/90">
            <LegalDocumentTrigger label="KVKK Aydınlatma Metni" slug="kvkk-aydinlatma-metni" className="text-left" />
            <LegalDocumentTrigger label="Gizlilik Politikası" slug="gizlilik-politikasi" className="text-left" />
            <LegalDocumentTrigger label="Çerez Politikası" slug="cerez-politikasi" className="text-left" />
            <LegalDocumentTrigger label="Mesafeli Satış Sözleşmesi" slug="mesafeli-satis-sozlesmesi" className="text-left" />
          </div>
        </div>

        <div>
          <p className="font-semibold">Bülten ve Kampanya</p>
          <form onSubmit={submitNewsletter} className="mt-2 space-y-2">
            <input
              className="input text-slate-900 placeholder:text-slate-400"
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-primary w-full" type="submit">
              Bültene Katıl
            </button>
          </form>
          {message ? <p className="mt-2 text-xs text-cyan-100">{message}</p> : null}
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Güvenli Ödeme</p>
            <p className="text-xs text-white/70">Ödemeniz SSL ve PCI-DSS uyumlu güvenli altyapı ile korunur.</p>
          </div>
          <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm md:w-auto" aria-label="Desteklenen ödeme yöntemleri">
            <div className="flex min-w-max items-center md:justify-end">
              <img
                src={paymentBadge.src}
                alt={paymentBadge.alt}
                width={250}
                height={36}
                loading="lazy"
                className="h-8 w-auto"
                style={{ animation: "rise-up 0.3s ease both" }}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
