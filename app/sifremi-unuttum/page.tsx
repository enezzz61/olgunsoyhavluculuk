"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const purpose = searchParams.get("purpose") || "user";
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("Geçersiz veya eksik sıfırlama linki.");
    }
  }, [token]);

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

          {message ? <p className="section-sub">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
