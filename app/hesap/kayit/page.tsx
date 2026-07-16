"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppToast } from "@/components/app-toast";
import { LegalDocumentTrigger } from "@/components/legal-document-trigger";
import { useStore } from "@/components/store-provider";
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    const nextErrors: RegisterErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Ad Soyad en az 2 karakter olmali.";
    }

    if (!email.includes("@")) {
      nextErrors.email = "Gecerli bir e-posta girin.";
    }

    if (password.length < 6) {
      nextErrors.password = "Sifre en az 6 karakter olmali.";
    }

    if (!acceptedPolicies) {
      nextErrors.policies = "Kayit icin yasal metinleri onaylaman gerekir.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessageType("error");
      setMessage("Lutfen formdaki hatalari duzeltin.");
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
            <h1 className="section-title">Hesabin hazir</h1>
            <p className="section-sub">Kayit tamamlandi. Hesap ekranindan devam edebilirsin.</p>
            <div className="flex flex-wrap gap-2">
              <Link href={safeNext} className="btn btn-primary">Devam Et</Link>
              <Link href="/urunler" className="btn btn-secondary">Alisverise Don</Link>
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
          <p className="hero-kicker">Yeni Musteri</p>
          <h1 className="section-title">Kayit Ol</h1>
          <p className="section-sub">Rolunu sec, hesabini olustur ve fiyatlarini buna gore gor.</p>

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
              placeholder="Sifre"
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
            <button
              type="button"
              className="menu-chip"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isSubmitting}
            >
              {showPassword ? "Sifreyi Gizle" : "Sifreyi Goster"}
            </button>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={isSubmitting}
            >
              <option value="perakende">Perakende</option>
              <option value="toptanci">Toptanci</option>
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
                <LegalDocumentTrigger label="KVKK Aydinlatma Metni" slug="kvkk-aydinlatma-metni" className="font-semibold text-slate-800 underline" />, {" "}
                <LegalDocumentTrigger label="Gizlilik Politikasi" slug="gizlilik-politikasi" className="font-semibold text-slate-800 underline" /> ve {" "}
                <LegalDocumentTrigger label="Kullanim Kosullari" slug="kullanim-kosullari" className="font-semibold text-slate-800 underline" />
                &apos;ni okudum, onayliyorum.
              </span>
            </label>
            {errors.policies ? <p className="form-error">{errors.policies}</p> : null}

            <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kayit olusturuluyor..." : "Kayit Ol"}
            </button>
          </form>

          <p className="section-sub">
            Zaten hesabin var mi? <Link href={`/hesap/giris?next=${encodeURIComponent(safeNext)}`} className="font-semibold text-slate-800">Giris yap</Link>
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
              <p className="hero-kicker">Yeni Musteri</p>
              <h1 className="section-title">Kayit Ol</h1>
              <p className="section-sub">Sayfa yukleniyor...</p>
            </div>
          </div>
        </section>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
