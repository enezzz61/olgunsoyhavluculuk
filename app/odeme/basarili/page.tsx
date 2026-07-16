"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useStore } from "@/components/store-provider";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") || params.get("token") || "";
  const { confirmPayment } = useStore();
  const [message, setMessage] = useState(
    sessionId ? "Odeme dogrulaniyor..." : "Gecerli odeme oturumu bulunamadi.",
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
      setMessage(result.message);
      setOk(result.ok);
    });

    return () => {
      active = false;
    };
  }, [confirmPayment, sessionId]);

  return (
    <section className="page-shell">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <article className="panel space-y-4">
          <h1 className="section-title">Odeme Sonucu</h1>
          <p className={ok ? "text-emerald-700" : "text-amber-700"}>{message}</p>
          <div className="flex gap-3">
            <Link href="/siparisler" className="btn btn-primary">
              Siparislerime Git
            </Link>
            <Link href="/urunler" className="btn btn-secondary">
              Alisverise Don
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
              <h1 className="section-title">Odeme Sonucu</h1>
              <p className="text-slate-700">Odeme dogrulaniyor...</p>
            </article>
          </div>
        </section>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
