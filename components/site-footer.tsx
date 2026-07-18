"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LegalDocumentTrigger } from "@/components/legal-document-trigger";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const paymentBadge = { src: "/payments/footer.png", alt: "Desteklenen odeme yontemleri" };

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
          <p className="mt-2 text-white/80">Toptanci ve perakende havlu operasyonunu dijitalde hizlandiran modern siparis platformu.</p>
          <p className="mt-3 text-xs text-white/60">Kampanya, yeni urun ve sezonluk teklif duyurulari e-posta ile iletilir.</p>
        </div>

        <div>
          <p className="font-semibold">Menuler</p>
          <div className="mt-2 flex flex-col gap-1 text-white/80">
            <Link href="/">Ana Sayfa</Link>
            <Link href="/urunler">Urunler</Link>
            <Link href="/hesap/giris">Giris Yap</Link>
            <Link href="/hesap/kayit">Kayit Ol</Link>
            <Link href="/kargo-takip">Kargo Takip</Link>
            <LegalDocumentTrigger
              label="Yasal Sozlesmeler"
              className="text-left"
            />
          </div>
        </div>

        <div>
          <p className="font-semibold">Iletisim</p>
          <p className="mt-2 text-white/75">Toptan satis, otel projeleri ve ozel uretim talepleri icin bize ulasabilirsiniz.</p>
          <p className="mt-2 text-white/75">E-posta: destek@olgunsoy.com</p>
          <div className="mt-3 flex flex-col gap-1 text-xs text-cyan-100/90">
            <LegalDocumentTrigger label="KVKK Aydinlatma Metni" slug="kvkk-aydinlatma-metni" className="text-left" />
            <LegalDocumentTrigger label="Gizlilik Politikasi" slug="gizlilik-politikasi" className="text-left" />
            <LegalDocumentTrigger label="Cerez Politikasi" slug="cerez-politikasi" className="text-left" />
            <LegalDocumentTrigger label="Mesafeli Satis Sozlesmesi" slug="mesafeli-satis-sozlesmesi" className="text-left" />
          </div>
        </div>

        <div>
          <p className="font-semibold">Bulten ve Kampanya</p>
          <form onSubmit={submitNewsletter} className="mt-2 space-y-2">
            <input
              className="input"
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-primary w-full" type="submit">
              Bultene Katil
            </button>
          </form>
          {message ? <p className="mt-2 text-xs text-cyan-100">{message}</p> : null}
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="text-xs text-white/70">Odemeniz SSL ve PCI-DSS uyumlu guvenli altyapi ile korunur.</p>
          <div className="w-full overflow-x-auto md:w-auto" aria-label="Desteklenen odeme yontemleri">
            <div className="flex min-w-max items-center pb-1 md:justify-end">
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
