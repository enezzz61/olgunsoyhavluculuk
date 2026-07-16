"use client";

import { useEffect, useState } from "react";
import { LegalDocumentTrigger } from "@/components/legal-document-trigger";

const COOKIE_KEY = "olgunsoy_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const value = window.localStorage.getItem(COOKIE_KEY);
    const timer = window.setTimeout(() => {
      setVisible(!value);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <aside className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cerez onayi">
      <p>
        Daha iyi urun onerileri, kampanya gosterimi ve performans icin cerez kullaniyoruz.
        Devam ederek <LegalDocumentTrigger label="Cerez Politikasi" slug="cerez-politikasi" className="font-semibold underline" /> ve <LegalDocumentTrigger label="KVKK Aydinlatma Metni" slug="kvkk-aydinlatma-metni" className="font-semibold underline" /> kapsamindaki surecleri kabul etmis olursun.
      </p>
      <div className="cookie-actions">
        <button
          className="btn btn-secondary"
          onClick={() => {
            window.localStorage.setItem(COOKIE_KEY, "essential");
            setVisible(false);
          }}
        >
          Sadece Zorunlu
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            window.localStorage.setItem(COOKIE_KEY, "all");
            setVisible(false);
          }}
        >
          Hepsini Kabul Et
        </button>
      </div>
    </aside>
  );
}
