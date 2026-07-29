"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppToast } from "@/components/app-toast";

type Announcement = {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
  showOnHome: boolean;
  createdAt: string;
  updatedAt: string;
};

type AnnouncementFormState = {
  title: string;
  body: string;
  isActive: boolean;
  showOnHome: boolean;
};

const initialForm: AnnouncementFormState = {
  title: "",
  body: "",
  isActive: true,
  showOnHome: true,
};

export function AdminAnnouncementsPanel() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementFormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAnnouncements() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/announcements", { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean; announcements?: Announcement[]; message?: string };
      if (!response.ok || !data.ok) {
        setMessage(data.message || "Duyurular yuklenemedi.");
        return;
      }

      setItems(data.announcements || []);
    } catch {
      setMessage("Duyurular yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAnnouncements();
  }, []);

  function startEdit(item: Announcement) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      body: item.body,
      isActive: item.isActive,
      showOnHome: item.showOnHome,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function submitAnnouncement(e: FormEvent) {
    e.preventDefault();

    const payload = {
      id: editingId,
      title: form.title.trim(),
      body: form.body.trim(),
      isActive: form.isActive,
      showOnHome: form.showOnHome,
    };

    const response = await fetch("/api/admin/announcements", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !data.ok) {
      setMessage(data.message || "Duyuru kaydedilemedi.");
      return;
    }

    setMessage(data.message || (editingId ? "Duyuru guncellendi." : "Duyuru olusturuldu."));
    resetForm();
    await loadAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    const response = await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !data.ok) {
      setMessage(data.message || "Duyuru silinemedi.");
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setMessage(data.message || "Duyuru silindi.");
    await loadAnnouncements();
  }

  return (
    <div className="panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Duyuru Yönetimi</h2>
          <p className="section-sub">Duyuruları oluştur, düzenle, arşivle veya sil.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void loadAnnouncements()} disabled={loading}>
          {loading ? "Yenileniyor..." : "Yenile"}
        </button>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={submitAnnouncement}>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="input"
            placeholder="Duyuru başlığı"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Yayında
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.showOnHome}
                onChange={(e) => setForm((prev) => ({ ...prev, showOnHome: e.target.checked }))}
              />
              Ana sayfada göster
            </label>
          </div>
        </div>
        <textarea
          className="input min-h-[120px]"
          placeholder="Duyuru metni"
          value={form.body}
          onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
          required
        />
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" type="submit">
            {editingId ? "Duyuruyu Güncelle" : "Duyuru Ekle"}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Vazgeç
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="cart-row items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {item.isActive ? "Yayında" : "Pasif"}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${item.showOnHome ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>
                    {item.showOnHome ? "Ana sayfada" : "Sadece yönetimde"}
                  </span>
                  <span className="text-slate-500">{new Date(item.createdAt).toLocaleString("tr-TR")}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="whitespace-pre-line text-sm text-slate-700">{item.body}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => startEdit(item)}>
                  Düzenle
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => void deleteAnnouncement(item.id)}>
                  Sil
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-500">Henüz duyuru eklenmedi.</p>
        )}
      </div>

      {message ? <AppToast message={message} onClose={() => setMessage("")} /> : null}
    </div>
  );
}
