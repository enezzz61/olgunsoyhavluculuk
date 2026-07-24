"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useStore } from "@/components/store-provider";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") || params.get("token") || params.get("conversationId") || "";
  const paymentMethod = params.get("method") || "";
  const { confirmPayment } = useStore();
  const [message, setMessage] = useState(
    sessionId ? "Ödeme doğrulanıyor..." : "Geçerli ödeme oturumu bulunamadı.",
  );
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let active = true;
    confirmPayment(sessionId).then((result) => {
      if (!active) {
        return;
      }
      setMessage(result.message || "Ödeme doğrulanamadı.");
      setOk(result.ok);
    }).catch(() => {
      if (!active) {
        return;
      }
      setMessage("Ödeme doğrulama isteği başarısız oldu.");
      setOk(false);
    });

    return () => {
      active = false;
    };
  }, [confirmPayment, sessionId]);

  return (
    <section className="page-shell">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <article className="panel space-y-4">
          <h1 className="section-title">Ödeme Sonucu</h1>
          <p className={ok ? "text-emerald-700" : "text-amber-700"}>{message}</p>
          {paymentMethod === "bank-transfer" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Havale / EFT seçildi.</p>
              <p className="mt-1">Ödemeniz onaylandığında siparişiniz oluşturulur. Banka transfer bilgileri için destek hattımızla iletişime geçebilirsiniz.</p>
            </div>
          ) : null}
          <div className="flex gap-3">
            <Link href="/siparisler" className="btn btn-primary">
              Siparişlerime Git
            </Link>
            <Link href="/urunler" className="btn btn-secondary">
              Alışverişe Dön
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <section className="page-shell">
          <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
            <article className="panel space-y-4">
              <h1 className="section-title">Ödeme Sonucu</h1>
              <p className="text-slate-700">Ödeme doğrulanıyor...</p>
            </article>
          </div>
        </section>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
