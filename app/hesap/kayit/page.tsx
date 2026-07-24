"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppToast } from "@/components/app-toast";
import { LegalDocumentTrigger } from "@/components/legal-document-trigger";
import { PasswordStrength } from "@/components/password-strength";
import { useStore } from "@/components/store-provider";
import { PASSWORD_MIN_LENGTH, validatePassword } from "@/lib/password-rules";
import type { UserRole } from "@/lib/products";

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  policies?: string;
};

function RegisterContent() {
  const { user, register } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "";
  const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/hesap";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [role, setRole] = useState<UserRole>("perakende");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const passwordRequirements = [
    {
      label: `En az ${PASSWORD_MIN_LENGTH} karakter`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      label: "En az bir büyük harf",
      met: /[A-Z]/.test(password),
    },
    {
      label: "En az bir küçük harf",
      met: /[a-z]/.test(password),
    },
    {
      label: "En az bir rakam",
      met: /\d/.test(password),
    },
  ];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    const nextErrors: RegisterErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Ad Soyad en az 2 karakter olmalı.";
    }

    if (!email.includes("@")) {
      nextErrors.email = "Geçerli bir e-posta girin.";
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      nextErrors.password = passwordValidation.errors.join(" ");
    }

    if (!acceptedPolicies) {
      nextErrors.policies = "Kayıt için yasal metinleri onaylaman gerekir.";
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
      const result = await register({ name, email, password, role });
      setMessageType(result.ok ? "success" : "error");
      setMessage(result.message);

      if (result.ok) {
        router.push(safeNext);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user) {
    return (
      <section className="page-shell">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
          <article className="panel space-y-3">
            <p className="hero-kicker">Oturum Aktif</p>
            <h1 className="section-title">Hesabın hazır</h1>
            <p className="section-sub">Kayıt tamamlandı. Hesap ekranından devam edebilirsin.</p>
            <div className="flex flex-wrap gap-2">
              <Link href={safeNext} className="btn btn-primary">Devam Et</Link>
              <Link href="/urunler" className="btn btn-secondary">Alışverişe Dön</Link>
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
          <p className="hero-kicker">Yeni Müşteri</p>
          <h1 className="section-title">Kayıt Ol</h1>
          <p className="section-sub">Rolünü seç, hesabını oluştur ve fiyatlarını buna göre gör.</p>

          <form className="space-y-3" onSubmit={onSubmit}>
            <input
              className={`input ${errors.name ? "input-error" : ""}`}
              placeholder="Ad Soyad"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.name)}
              disabled={isSubmitting}
              required
            />
            {errors.name ? <p className="form-error">{errors.name}</p> : null}
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
              minLength={6}
            />
            {errors.password ? <p className="form-error">{errors.password}</p> : null}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Şifre koşulları</p>
              <ul className="space-y-1 pl-0">
                {passwordRequirements.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${item.met ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                      {item.met ? "✓" : "•"}
                    </span>
                    <span className={item.met ? "text-emerald-700" : "text-slate-600"}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between gap-2">
              <PasswordStrength password={password} />
              <button
                type="button"
                className="menu-chip"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
              >
                {showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
              </button>
            </div>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={isSubmitting}
            >
              <option value="perakende">Perakende</option>
              <option value="toptanci">Toptancı</option>
            </select>

            <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={acceptedPolicies}
                onChange={(e) => {
                  setAcceptedPolicies(e.target.checked);
                  if (errors.policies) {
                    setErrors((prev) => ({ ...prev, policies: undefined }));
                  }
                }}
                disabled={isSubmitting}
              />
              <span>
                <LegalDocumentTrigger label="KVKK Aydınlatma Metni" slug="kvkk-aydinlatma-metni" className="font-semibold text-slate-800 underline" />, {" "}
                <LegalDocumentTrigger label="Gizlilik Politikası" slug="gizlilik-politikasi" className="font-semibold text-slate-800 underline" /> ve {" "}
                <LegalDocumentTrigger label="Kullanım Koşulları" slug="kullanim-kosullari" className="font-semibold text-slate-800 underline" />
                &apos;ni okudum, onaylıyorum.
              </span>
            </label>
            {errors.policies ? <p className="form-error">{errors.policies}</p> : null}

            <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kayıt oluşturulu yor..." : "Kayıt Ol"}
            </button>
          </form>

          <p className="section-sub">
            Zaten hesabın var mı? <Link href={`/hesap/giris?next=${encodeURIComponent(safeNext)}`} className="font-semibold text-slate-800">Giriş yap</Link>
          </p>
        </div>
      </div>
      <AppToast message={message} type={messageType} onClose={() => setMessage("")} />
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <section className="page-shell">
          <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
            <div className="panel mx-auto max-w-xl space-y-4">
              <p className="hero-kicker">Yeni Müşteri</p>
              <h1 className="section-title">Kayıt Ol</h1>
              <p className="section-sub">Sayfa yükleniyor...</p>
            </div>
          </div>
        </section>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
