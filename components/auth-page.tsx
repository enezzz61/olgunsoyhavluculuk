"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AppToast } from "@/components/app-toast";
import { useStore } from "@/components/store-provider";

type AuthPageProps = {
  mode: "user" | "admin";
  title: string;
  kicker: string;
  description: string;
  defaultNext: string;
  ctaHref: string;
  ctaLabel: string;
  alternateHref: string;
  alternateLabel: string;
};

type LoginErrors = {
  email?: string;
  password?: string;
};

function getSafeNext(rawNext: string, defaultNext: string) {
  if (rawNext.startsWith("/") && !rawNext.startsWith("//")) {
    return rawNext;
  }

  return defaultNext;
}

export function AuthPage({
  mode,
  title,
  kicker,
  description,
  defaultNext,
  ctaHref,
  ctaLabel,
  alternateHref,
  alternateLabel,
}: AuthPageProps) {
  const { user, login, logout } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "";
  const safeNext = getSafeNext(rawNext, defaultNext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    const nextErrors: LoginErrors = {};

    if (!email.includes("@")) {
      nextErrors.email = "Geçerli bir e-posta girin.";
    }

    if (password.length < 6) {
      nextErrors.password = "Şifre en az 6 karakter olmalı.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessageType("error");
      setMessage("Lütfen formdaki hataları düzeltin.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await login(email, password, mode);
      setMessageType(result.ok ? "success" : "error");

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      if (mode === "admin" && !result.user?.isAdmin) {
        await logout();
        setMessageType("error");
        setMessage("Bu sayfa sadece admin hesabına açık.");
        return;
      }

      setMessage(result.message);
      router.push(safeNext);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onResetPassword(e: FormEvent) {
    e.preventDefault();
    if (isResetting) {
      return;
    }

    if (!resetEmail.includes("@")) {
      setMessageType("error");
      setMessage("Geçerli bir e-posta girin.");
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, purpose: mode }),
      });

      const data = (await response.json()) as { ok?: boolean; message?: string };
      setMessageType(response.ok && data.ok ? "success" : "error");
      setMessage(data.message || "İşlem tamamlanamadı.");

      if (response.ok && data.ok) {
        setResetEmail("");
        setShowResetForm(false);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setMessageType("error");
      setMessage("Şifre sıfırlama isteği oluşturulamadı.");
    } finally {
      setIsResetting(false);
    }
  }

  if (user) {
    const isAdmin = user.isAdmin;

    if (mode === "admin" && !isAdmin) {
      return (
        <section className="page-shell">
          <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
            <article className="panel space-y-3">
              <p className="hero-kicker">{kicker}</p>
              <h1 className="section-title">Bu sayfa sadece yönetici için</h1>
              <p className="section-sub">Normal hesapla yönetici girişine devam edemezsin.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/hesap/giris" className="btn btn-primary">
                  Normal girişe dön
                </Link>
                <Link href={alternateHref} className="btn btn-secondary">
                  {alternateLabel}
                </Link>
              </div>
            </article>
          </div>
        </section>
      );
    }

    return (
      <section className="page-shell">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
          <article className="panel space-y-3">
            <p className="hero-kicker">{kicker}</p>
            <h1 className="section-title">{isAdmin && mode === "admin" ? "Admin oturumu aktif" : "Zaten giriş yaptın"}</h1>
            <p className="section-sub">
              {isAdmin && mode === "admin"
                ? "Admin paneline doğrudan devam edebilirsin."
                : "Hesabına devam etmek için aşağıdan ilerleyebilirsin."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={safeNext} className="btn btn-primary">
                Devam Et
              </Link>
              <Link href={alternateHref} className="btn btn-secondary">
                {alternateLabel}
              </Link>
            </div>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
        <div className="panel mx-auto max-w-xl space-y-4">
          <p className="hero-kicker">{kicker}</p>
          <h1 className="section-title">{title}</h1>
          <p className="section-sub">{description}</p>

          <form className="space-y-3" onSubmit={onSubmit}>
            <input
              className={`input ${errors.email ? "input-error" : ""}`}
              placeholder="E-posta"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.email)}
              disabled={isSubmitting}
              required
            />
            {errors.email ? <p className="form-error">{errors.email}</p> : null}
            <div className="space-y-2">
              <input
                className={`input ${errors.password ? "input-error" : ""}`}
                placeholder="Şifre"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                aria-invalid={Boolean(errors.password)}
                disabled={isSubmitting}
                required
              />
              {errors.password ? <p className="form-error">{errors.password}</p> : null}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="menu-chip"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isSubmitting}
                >
                  {showPassword ? "Sifreyi Gizle" : "Sifreyi Goster"}
                </button>
              </div>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Giris yapiliyor..." : "Giris Yap"}
            </button>
          </form>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <button
              type="button"
              className="menu-chip"
              onClick={() => setShowResetForm((prev) => !prev)}
            >
              {showResetForm ? "Şifre sıfırlama formunu kapat" : "Şifremi unuttum / sıfırla"}
            </button>

            {showResetForm ? (
              <form className="mt-3 space-y-2" onSubmit={onResetPassword}>
                <input
                  className="input"
                  placeholder="Sıfırlanacak e-posta"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isResetting}
                  required
                />
                <button className="btn btn-secondary w-full" type="submit" disabled={isResetting}>
                  {isResetting ? "Gönderiliyor..." : "Şifre Sıfırlama Linki Gönder"}
                </button>
              </form>
            ) : null}
          </div>

          <p className="section-sub">
            {mode === "admin" ? (
              <Link href={ctaHref} className="font-semibold text-slate-800">
                {ctaLabel}
              </Link>
            ) : (
              <>
                Hesabin yok mu?{" "}
                <Link href={ctaHref} className="font-semibold text-slate-800">
                  {ctaLabel}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
      <AppToast message={message} type={messageType} onClose={() => setMessage("")} />
    </section>
  );
}