"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppToast } from "@/components/app-toast";

type Subscriber = {
  id: string;
  email: string;
  source?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const initialCompose = {
  subject: "",
  body: "",
};

export function AdminNewsletterPanel() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [compose, setCompose] = useState(initialCompose);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSubscribers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/newsletter", { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean; subscribers?: Subscriber[]; message?: string };
      if (!response.ok || !data.ok) {
        setMessage(data.message || "Bülten listesi yuklenemedi.");
        return;
      }

      setSubscribers(data.subscribers || []);
    } catch {
      setMessage("Bülten listesi yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSubscribers();
  }, []);

  async function sendNewsletter(e: FormEvent) {
    e.preventDefault();

    if (!compose.subject.trim() || !compose.body.trim()) {
      setMessage("Konu ve mesaj alanları gerekli.");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: compose.subject.trim(),
          body: compose.body.trim(),
        }),
      });

      const data = (await response.json()) as { ok?: boolean; message?: string; sentCount?: number };
      if (!response.ok || !data.ok) {
        setMessage(data.message || "Bülten gönderilemedi.");
        return;
      }

      setMessage(data.message || `${data.sentCount || 0} kişiye mail gönderildi.`);
      setCompose(initialCompose);
    } catch {
      setMessage("Bülten gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Bülten Yönetimi</h2>
          <p className="section-sub">Bülten üyelerini görüntüle ve toplu e-posta gönder.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void loadSubscribers()} disabled={loading}>
          {loading ? "Yenileniyor..." : "Yenile"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        Toplam aktif abone: <strong>{subscribers.filter((item) => item.active).length}</strong>
      </div>

      <form className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={sendNewsletter}>
        <input
          className="input"
          placeholder="Mail konusu"
          value={compose.subject}
          onChange={(e) => setCompose((prev) => ({ ...prev, subject: e.target.value }))}
          required
        />
        <textarea
          className="input min-h-[180px]"
          placeholder="Mail içeriği"
          value={compose.body}
          onChange={(e) => setCompose((prev) => ({ ...prev, body: e.target.value }))}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={sending}>
          {sending ? "Gönderiliyor..." : "Abonelere Gönder"}
        </button>
      </form>

      <div className="space-y-2">
        {subscribers.length ? (
          subscribers.map((item) => (
            <article key={item.id} className="cart-row">
              <div>
                <p className="font-semibold text-slate-900">{item.email}</p>
                <p className="text-xs text-slate-500">Kaynak: {item.source || "site"} · {new Date(item.createdAt).toLocaleString("tr-TR")}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {item.active ? "Aktif" : "Pasif"}
              </span>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-500">Henüz bülten abonesi yok.</p>
        )}
      </div>

      {message ? <AppToast message={message} onClose={() => setMessage("")} /> : null}
    </div>
  );
}
