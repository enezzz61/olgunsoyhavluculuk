"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export function IyzicoBadgeControl() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("iyzico-badge-hidden", hidden);

    return () => {
      document.body.classList.remove("iyzico-badge-hidden");
    };
  }, [hidden]);

  return (
    <>
      <Script id="iyzico-buyer-protection-inline" strategy="afterInteractive">
        {`window.iyz = { token: '6e7cdd7e-3b6c-4226-96c7-d558ef1ea261', position: 'bottomLeft', ideaSoft: false, pwi: true };`}
      </Script>
      <Script
        id="iyzico-buyer-protection-script"
        src="https://static.iyzipay.com/buyer-protection/buyer-protection.js"
        strategy="afterInteractive"
      />
      <button
        type="button"
        className={`iyzico-badge-toggle ${hidden ? "iyzico-badge-toggle-restore" : ""}`}
        onClick={() => setHidden((prev) => !prev)}
        aria-label={hidden ? "Iyzico rozetini goster" : "Iyzico rozetini kapat"}
      >
        {hidden ? "Iyzico rozetini goster" : "Iyzico rozetini kapat"}
      </button>
    </>
  );
}
