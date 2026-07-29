"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppToast } from "@/components/app-toast";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const purpose = searchParams.get("purpose") || "user";
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(token ? "" : "Geçersiz veya eksik sıfırlama linki.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingNewLink, setIsRequestingNewLink] = useState(false);
  const [showRecoveryForm, setShowRecoveryForm] = useState(!token);

  async function onRequestNewLink(e: FormEvent) {
    e.preventDefault();

    if (!email.includes("@")) {
      setMessage("Geçerli bir e-posta girin.");
      return;
    }

    setIsRequestingNewLink(true);
    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });

      const data = (await response.json()) as { ok?: boolean; message?: string };
      setMessage(data.message || "İşlem tamamlanamadı.");

      if (response.ok && data.ok) {
        setShowRecoveryForm(false);
      }
    } catch (error) {
      console.error("Request new reset link error:", error);
      setMessage("Yeni sıfırlama linki gönderilemedi.");
    } finally {
      setIsRequestingNewLink(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/confirm-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = (await response.json()) as { ok?: boolean; message?: string };
      setMessage(data.message || "İşlem tamamlanamadı.");

      if (!response.ok || !data.ok) {
        const normalizedMessage = (data.message || "").toLowerCase();
        if (normalizedMessage.includes("geçersiz") || normalizedMessage.includes("gecersiz") || normalizedMessage.includes("süresi dolmuş") || normalizedMessage.includes("suresi dolmus")) {
          setShowRecoveryForm(true);
          setMessage("Bu link artık geçerli değil. Yeni sıfırlama linki isteyebilirsin.");
          return;
        }
      }
    } catch (error) {
      console.error("Confirm reset error:", error);
      setMessage("Şifre güncellenirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-shell">
      <div className="mx-auto w-full max-w-xl px-4 py-16 md:px-8">
        <div className="panel space-y-4">
          <p className="hero-kicker">Şifre Sıfırlama</p>
          <h1 className="section-title">Yeni şifreni oluştur</h1>
          <p className="section-sub">
            {purpose === "admin" ? "Admin hesabı için yeni şifre belirle." : "Hesabın için yeni şifre belirle."}
          </p>

          <form className="space-y-3" onSubmit={onSubmit}>
            <input
              className="input"
              type="password"
              placeholder="Yeni şifre"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>

          {showRecoveryForm ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Yeni sıfırlama bağlantısı gönder</p>
              <form className="space-y-3" onSubmit={onRequestNewLink}>
                <input
                  className="input"
                  type="email"
                  placeholder="E-posta adresin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="btn btn-secondary w-full" type="submit" disabled={isRequestingNewLink}>
                  {isRequestingNewLink ? "Gönderiliyor..." : "Yeni link gönder"}
                </button>
              </form>
            </div>
          ) : null}

          {message ? <p className="section-sub">{message}</p> : null}
          <AppToast message={message} type={message.toLowerCase().includes("başar") || message.toLowerCase().includes("basar") ? "success" : "error"} onClose={() => setMessage("")} />
        </div>
      </div>
    </section>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="page-shell"><div className="mx-auto w-full max-w-xl px-4 py-16 md:px-8"><div className="panel">Yükleniyor...</div></div></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
