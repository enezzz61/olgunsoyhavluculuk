"use client";

import Link from "next/link";
import { useStore } from "@/components/store-provider";
import { formatTry } from "@/lib/money";
import { orderStatusClass, orderStatusLabel } from "@/lib/order-status";

export default function OrdersPage() {
  const { orders, user } = useStore();

  if (!user) {
    return (
      <section className="page-shell">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
          <article className="panel">
            <h1 className="section-title">Siparislerim</h1>
            <p className="section-sub">
              Bu sayfayi gormek icin once <Link href="/hesap/giris?next=%2Fsiparisler">giris yapmalisin</Link>.
            </p>
          </article>
        </div>
      </section>
    );
  }

  const myOrders = orders.filter((item) => item.userId === user.id);

  return (
    <section className="page-shell">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10 md:px-8">
        <h1 className="section-title">Siparislerim</h1>

        {!myOrders.length ? (
          <article className="panel">
            <p className="section-sub">Henuz siparisiniz bulunmuyor.</p>
            <Link href="/urunler" className="btn btn-primary mt-3">
              Alisverise Basla
            </Link>
          </article>
        ) : null}

        {myOrders.map((order) => (
          <article key={order.id} className="panel space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Siparis No: {order.id}</p>
              <div className="flex items-center gap-2">
                <span className={orderStatusClass(order.status)}>
                  {orderStatusLabel[order.status]}
                </span>
                <p className="section-sub">
                  {new Date(order.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>
            <p className="section-sub">Kargo Firmasi: {order.cargoCompany || "-"}</p>
            <p className="section-sub">Takip Kodu: {order.trackingCode || "-"}</p>
            {order.trackingCode ? (
              <p className="section-sub">
                Takip icin <Link href={`/kargo-takip`}>Kargo Takip</Link> ekranina kodu gir.
              </p>
            ) : null}
            <ul className="space-y-1 text-sm text-slate-700">
              {order.items.map((item) => (
                <li key={`${order.id}-${item.productId}`}>
                  {item.name} - {item.quantity} x {formatTry(item.unitPrice)}
                </li>
              ))}
            </ul>
            <p className="text-lg font-bold">Toplam: {formatTry(order.total)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
