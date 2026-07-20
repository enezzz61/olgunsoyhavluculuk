"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AppToast } from "@/components/app-toast";
import { AddressManager } from "@/components/address-manager";
import { useStore } from "@/components/store-provider";

type ProfileErrors = {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
};

export default function AccountPage() {
  const { user, logout, updateProfile } = useStore();
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  async function onUpdateProfile(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    const nextErrors: ProfileErrors = {};

    if (!name.trim() && !newPassword.trim()) {
      nextErrors.name = "Ad güncellemek için bir değer girin.";
      nextErrors.newPassword = "Şifre güncellemek için yeni şifre girin.";
    }

    if (newPassword && newPassword.length < 6) {
      nextErrors.newPassword = "Yeni şifre en az 6 karakter olmalı.";
    }

    if (newPassword && !currentPassword) {
      nextErrors.currentPassword = "Şifre değişimi için mevcut şifre gerekli.";
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
      const result = await updateProfile({
        name: name.trim(),
        currentPassword,
        newPassword,
      });

      setMessageType(result.ok ? "success" : "error");
      setMessage(result.message);

      if (result.ok) {
        setCurrentPassword("");
        setNewPassword("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user) {
    return (
      <section className="page-shell">
        <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-10 md:grid-cols-2 md:px-8">
          <article className="panel space-y-2">
            <h1 className="section-title">Hesabım</h1>
            <p>
              <strong>Ad:</strong> {user.name}
            </p>
            <p>
              <strong>E-posta:</strong> {user.email}
            </p>
            <p>
              <strong>Rol:</strong> {user.role}
            </p>
            <div className="flex gap-3 pt-2">
              <Link href="/siparisler" className="btn btn-primary">
                Siparişlerim
              </Link>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  void logout();
                }}
              >
                Çıkış Yap
              </button>
            </div>
          </article>

          <article className="panel space-y-3">
            <h2 className="text-xl font-semibold">Profil Bilgilerini Güncelle</h2>
            <form className="space-y-3" onSubmit={onUpdateProfile}>
              <input
                className={`input ${errors.name ? "input-error" : ""}`}
                placeholder={`Ad Soyad (mevcut: ${user.name})`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                aria-invalid={Boolean(errors.name)}
                disabled={isSubmitting}
              />
              {errors.name ? <p className="form-error">{errors.name}</p> : null}
              <input
                className={`input ${errors.currentPassword ? "input-error" : ""}`}
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Mevcut şifre (şifre değişimi için)"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword) {
                    setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                  }
                }}
                aria-invalid={Boolean(errors.currentPassword)}
                disabled={isSubmitting}
              />
              {errors.currentPassword ? <p className="form-error">{errors.currentPassword}</p> : null}
              <button
                type="button"
                className="menu-chip"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                disabled={isSubmitting}
              >
                {showCurrentPassword ? "Mevcut şifreyi gizle" : "Mevcut şifreyi göster"}
              </button>

              <input
                className={`input ${errors.newPassword ? "input-error" : ""}`}
                type={showNewPassword ? "text" : "password"}
                placeholder="Yeni şifre"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }
                }}
                minLength={6}
                aria-invalid={Boolean(errors.newPassword)}
                disabled={isSubmitting}
              />
              {errors.newPassword ? <p className="form-error">{errors.newPassword}</p> : null}
              <button
                type="button"
                className="menu-chip"
                onClick={() => setShowNewPassword((prev) => !prev)}
                disabled={isSubmitting}
              >
                {showNewPassword ? "Yeni şifreyi gizle" : "Yeni şifreyi göster"}
              </button>

              <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Güncelleniyor..." : "Profili Güncelle"}
              </button>
            </form>

          </article>
        </div>

        {/* Adres Yönetimi */}
        <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
          <AddressManager />
        </div>

        <AppToast message={message} type={messageType} onClose={() => setMessage("")} />
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 md:grid-cols-2 md:px-8">
        <article className="panel space-y-3">
          <p className="hero-kicker">Hesap İşlem Merkezi</p>
          <h1 className="section-title">Giriş veya Kayıt</h1>
          <p className="section-sub">Devam etmek için uygun işlemi seç. Sayfalar ayrıldı ve mobilde daha sade bir deneyim sunuyor.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/hesap/giris" className="btn btn-secondary">Giriş Yap</Link>
            <Link href="/hesap/kayit" className="btn btn-primary">Kayıt Ol</Link>
          </div>
        </article>

        <article className="panel space-y-2">
          <h2 className="text-xl font-semibold">Demo Giriş Bilgileri</h2>
          <p className="section-sub">Perakende: perakende@olgunsoy.com / 123456</p>
          <p className="section-sub">Toptancı: toptanci@olgunsoy.com / 123456</p>
        </article>
      </div>
    </section>
  );
}
