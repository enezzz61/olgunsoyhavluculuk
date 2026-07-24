"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AppToast } from "@/components/app-toast";
import { AddressManager } from "@/components/address-manager";
import { PasswordStrength } from "@/components/password-strength";
import { useStore } from "@/components/store-provider";

type ProfileErrors = {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

type AccountSection = "profile" | "password" | "addresses" | "delete";

function getPasswordHint() {
  return "Şifre en az 8 karakter olmalı, büyük harf, küçük harf ve rakam içermeli.";
}

export default function AccountPage() {
  const { user, logout, updateProfile, deleteAccount } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMatchMessage, setPasswordMatchMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordVisible, setDeletePasswordVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<AccountSection>("profile");

  async function onUpdateProfile(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    const nextErrors: ProfileErrors = {};

    if (name.trim() && name.trim().length < 2) {
      nextErrors.name = "Ad soyad en az 2 karakter olmalı.";
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Geçerli bir e-posta adresi girin.";
    }

    if (!newPassword.trim() && !currentPassword.trim() && !name.trim() && !email.trim()) {
      nextErrors.newPassword = "Güncellemek için en az bir alan doldurun.";
    }

    if (newPassword && !currentPassword) {
      nextErrors.currentPassword = "Şifre değişimi için mevcut şifre gerekli.";
    }

    if (newPassword && !newPassword.trim()) {
      nextErrors.newPassword = "Şifre güncellemek için yeni şifre girin.";
    }

    if (newPassword) {
      const passwordValidation = /(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(newPassword);
      if (!passwordValidation) {
        nextErrors.newPassword = "Şifre en az 8 karakter, büyük harf, küçük harf ve rakam içermeli.";
      }
    }

    if (newPassword && confirmNewPassword !== newPassword) {
      nextErrors.confirmNewPassword = "Yeni şifreler eşleşmiyor.";
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
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        currentPassword,
        newPassword,
      });

      setMessageType(result.ok ? "success" : "error");
      setMessage(result.message);

      if (result.ok) {
        setName("");
        setEmail("");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user) {
    return (
      <section className="page-shell">
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 md:px-8">
          <article className="panel space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="hero-kicker">Hesabım</p>
                <h1 className="section-title">Profilim</h1>
                <p className="section-sub">Kişisel bilgilerin, adreslerin ve güvenlik ayarların bu sayfada tek ekranda yönetilir.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/siparisler" className="btn btn-primary">Siparişlerim</Link>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    void logout();
                  }}
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-600">Ad Soyad</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{user.name}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-600">E-posta</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{user.email}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-600">Rol</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{user.role}</p>
              </div>
            </div>
          </article>

          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="panel p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Hesap Menü</p>
              <div className="mt-4 space-y-2">
                {[
                  { key: "profile", label: "Profil Bilgileri" },
                  { key: "password", label: "Şifre Değiştir" },
                  { key: "addresses", label: "Adresler" },
                  { key: "delete", label: "Hesabı Sil" },
                ].map((item) => {
                  const isActive = activeSection === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveSection(item.key as AccountSection)}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${isActive ? "bg-cyan-600 text-white shadow-sm" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="space-y-4">
              {activeSection === "profile" ? (
                <article className="panel space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">Profil Bilgileri</h2>
                    <p className="mt-1 text-sm text-slate-600">Ad, soyad ve e-posta adresinizi ayrı alanlarda güncelleyebilirsiniz.</p>
                  </div>
                  <form className="space-y-4" onSubmit={onUpdateProfile}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">Ad Soyad</span>
                        <input
                          className={`input ${errors.name ? "input-error" : ""}`}
                          placeholder={`Mevcut: ${user.name}`}
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
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">E-posta Adresi</span>
                        <input
                          type="email"
                          className={`input ${errors.email ? "input-error" : ""}`}
                          placeholder={`Mevcut: ${user.email}`}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) {
                              setErrors((prev) => ({ ...prev, email: undefined }));
                            }
                          }}
                          aria-invalid={Boolean(errors.email)}
                          disabled={isSubmitting}
                        />
                        {errors.email ? <p className="form-error">{errors.email}</p> : null}
                      </label>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Değiştirmek istemiyorsanız ilgili alanı boş bırakabilirsiniz.
                    </div>
                    <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Güncelleniyor..." : "Profili Güncelle"}
                    </button>
                  </form>
                </article>
              ) : null}

              {activeSection === "password" ? (
                <article className="panel space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">Şifre Değiştir</h2>
                    <p className="mt-1 text-sm text-slate-600">Yeni şifrenizi güvenli bir şekilde ayarlayabilirsiniz.</p>
                  </div>
                  <form className="space-y-4" onSubmit={onUpdateProfile}>
                    <p className="text-sm text-slate-600">{getPasswordHint()}</p>
                    <div className="space-y-2">
                      <input
                        className={`input ${errors.currentPassword ? "input-error" : ""}`}
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Mevcut şifre"
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
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="menu-chip"
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          disabled={isSubmitting}
                        >
                          {showCurrentPassword ? "Mevcut şifreyi gizle" : "Mevcut şifreyi göster"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        className={`input ${errors.newPassword ? "input-error" : ""}`}
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Yeni şifre"
                        value={newPassword}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          setNewPassword(nextValue);
                          if (errors.newPassword) {
                            setErrors((prev) => ({ ...prev, newPassword: undefined }));
                          }
                          if (confirmNewPassword) {
                            setPasswordMatchMessage(nextValue === confirmNewPassword ? "Şifreler eşleşiyor." : "Şifreler eşleşmiyor.");
                          } else {
                            setPasswordMatchMessage(null);
                          }
                        }}
                        minLength={8}
                        aria-invalid={Boolean(errors.newPassword)}
                        disabled={isSubmitting}
                      />
                      <input
                        className={`input ${errors.confirmNewPassword ? "input-error" : ""}`}
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Yeni şifre tekrar"
                        value={confirmNewPassword}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          setConfirmNewPassword(nextValue);
                          if (errors.confirmNewPassword) {
                            setErrors((prev) => ({ ...prev, confirmNewPassword: undefined }));
                          }
                          if (!newPassword) {
                            setPasswordMatchMessage(null);
                          } else if (!nextValue) {
                            setPasswordMatchMessage(null);
                          } else if (nextValue === newPassword) {
                            setPasswordMatchMessage("Şifreler eşleşiyor.");
                          } else {
                            setPasswordMatchMessage("Şifreler eşleşmiyor.");
                          }
                        }}
                        minLength={8}
                        aria-invalid={Boolean(errors.confirmNewPassword)}
                        disabled={isSubmitting}
                      />
                      {errors.newPassword ? <p className="form-error">{errors.newPassword}</p> : null}
                      {errors.confirmNewPassword ? <p className="form-error">{errors.confirmNewPassword}</p> : null}
                      {passwordMatchMessage ? (
                        <p className={passwordMatchMessage === "Şifreler eşleşiyor." ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>
                          {passwordMatchMessage}
                        </p>
                      ) : null}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="menu-chip"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          disabled={isSubmitting}
                        >
                          {showNewPassword ? "Yeni şifreyi gizle" : "Yeni şifreyi göster"}
                        </button>
                      </div>
                      <PasswordStrength password={newPassword} />
                    </div>

                    <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                    </button>
                  </form>
                </article>
              ) : null}

              {activeSection === "addresses" ? (
                <article className="panel space-y-3">
                  <div>
                    <h2 className="text-xl font-semibold">Adreslerim</h2>
                    <p className="mt-1 text-sm text-slate-600">Adreslerinizi buradan ekleyip yönetebilirsiniz.</p>
                  </div>
                  <AddressManager />
                </article>
              ) : null}

              {activeSection === "delete" ? (
                <article className="panel space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-rose-700">Hesabı Sil</h2>
                    <p className="mt-1 text-sm text-slate-600">Bu işlem adres, sipariş ve profil bilgilerinizi kalıcı olarak siler.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary w-full bg-rose-600 hover:bg-rose-700"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={isSubmitting}
                  >
                    Hesabı Sil
                  </button>
                </article>
              ) : null}
            </div>
          </div>
        </div>

        {showDeleteModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-slate-900">Hesabınızı silmek istiyor musunuz?</h3>
              <p className="mt-2 text-sm text-slate-600">Devam etmek için şifrenizi yazın.</p>
              <div className="mt-4 space-y-2">
                <input
                  className="input"
                  type={deletePasswordVisible ? "text" : "password"}
                  placeholder="Şifreniz"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
                <button
                  type="button"
                  className="menu-chip"
                  onClick={() => setDeletePasswordVisible((prev) => !prev)}
                >
                  {deletePasswordVisible ? "Şifreyi gizle" : "Şifreyi göster"}
                </button>
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button className="btn btn-secondary" type="button" onClick={() => setShowDeleteModal(false)}>
                  İptal
                </button>
                <button
                  className="btn btn-primary bg-rose-600 hover:bg-rose-700"
                  type="button"
                  onClick={async () => {
                    const result = await deleteAccount(deletePassword);
                    setMessageType(result.ok ? "success" : "error");
                    setMessage(result.message);
                    if (result.ok) {
                      setShowDeleteModal(false);
                      setDeletePassword("");
                    }
                  }}
                >
                  Hesabı Sil
                </button>
              </div>
            </div>
          </div>
        ) : null}

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

      </div>
    </section>
  );
}
