"use client";

import { FormEvent, useState } from "react";
import { formatTry } from "@/lib/money";
import { orderStatusClass, orderStatusLabel, type OrderStatus } from "@/lib/order-status";

type TrackingEvent = {
  code: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
};

type TrackingOrder = {
  id: string;
  status: OrderStatus;
  cargoCompany?: string | null;
  trackingCode?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  total: number;
  items: Array<{ id: string; name: string; quantity: number; unitPrice: number }>;
  events?: TrackingEvent[];
};

export default function CargoTrackingPage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<TrackingOrder | null>(null);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setOrder(null);

    const code = trackingCode.trim();
    if (!code) {
      setMessage("Takip kodu girin.");
      return;
    }

    const response = await fetch(`/api/tracking/${encodeURIComponent(code)}`, {
      cache: "no-store",
    });
    const data = (await response.json()) as {
      ok: boolean;
      message?: string;
      order?: TrackingOrder;
    };

    if (!response.ok || !data.ok || !data.order) {
      setMessage(data.message || "Takip bilgisi bulunamadi.");
      return;
    }

    setOrder(data.order);
  }

  return (
    <section className="page-shell">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 md:px-8">
        <article className="panel space-y-4">
          <h1 className="section-title">Kargo Takip</h1>
          <p className="section-sub">Admin tarafindan paylasilan takip kodu ile siparis durumunu sorgula.</p>
          <form className="flex flex-col gap-3 md:flex-row" onSubmit={onSearch}>
            <input
              className="input"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Ornek: TRK12345"
            />
            <button className="btn btn-primary" type="submit">
              Takibi Sorgula
            </button>
          </form>
          {message ? <p className="text-sm text-amber-700">{message}</p> : null}
        </article>

        {order ? (
          <article className="panel space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Siparis No: {order.id}</p>
              <span className={orderStatusClass(order.status)}>{orderStatusLabel[order.status]}</span>
            </div>
            <p className="section-sub">Takip Kodu: {order.trackingCode || "-"}</p>
            <p className="section-sub">Kargo Firmasi: {order.cargoCompany || "-"}</p>
            <p className="section-sub">Siparis Tarihi: {new Date(order.createdAt).toLocaleString("tr-TR")}</p>
            {order.shippedAt ? (
              <p className="section-sub">Kargoya Verilis: {new Date(order.shippedAt).toLocaleString("tr-TR")}</p>
            ) : null}
            {order.deliveredAt ? (
              <p className="section-sub">Teslim Tarihi: {new Date(order.deliveredAt).toLocaleString("tr-TR")}</p>
            ) : null}
            <ul className="space-y-1 text-sm text-slate-700">
              {(order.items || []).map((item) => (
                <li key={item.id}>
                  {item.name} - {item.quantity} x {formatTry(item.unitPrice)}
                </li>
              ))}
            </ul>
            <p className="text-lg font-bold">Toplam: {formatTry(order.total)}</p>

            <div className="pt-2">
              <h2 className="text-lg font-semibold">Kargo Hareketleri</h2>
              <div className="mt-3 space-y-2">
                {(order.events || []).map((event) => (
                  <article key={event.code + event.timestamp} className="timeline-item">
                    <p className="font-semibold">{event.title}</p>
                    <p className="section-sub">{event.description}</p>
                    <p className="text-xs text-slate-500">
                      {event.location} - {new Date(event.timestamp).toLocaleString("tr-TR")}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
