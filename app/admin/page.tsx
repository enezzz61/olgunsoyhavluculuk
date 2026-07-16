"use client";

import { FormEvent, useEffect, useState } from "react";
import { useStore } from "@/components/store-provider";
import { formatTry } from "@/lib/money";
import { orderStatusLabel, type OrderStatus } from "@/lib/order-status";
import type { Product, WholesaleTier } from "@/lib/products";
import { getStockCountLabel, getStockStatusClass, getStockStatusLabel } from "@/lib/stock";

type Metrics = {
  users: number;
  products: number;
  orders: number;
  revenue: number;
};

type AuditLog = {
  id: string;
  requestId: string;
  route: string;
  method: string;
  ip?: string | null;
  userAgent?: string | null;
  level: "info" | "warn" | "error";
  event: string;
  message?: string | null;
  userId?: string | null;
  createdAt: string;
};

type AdminOrder = {
  id: string;
  total: number;
  status: OrderStatus;
  cargoCompany?: string | null;
  trackingCode?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

const initialForm = {
  sku: "",
  name: "",
  category: "",
  image: "",
  gallery: "",
  retailPrice: 0,
  stockCount: 0,
  stockStatus: "stokta",
  wholesaleEnabled: false,
  wholesaleTiers: [{ minQty: 10, unitPrice: 0 }],
  description: "",
};

type AuditLevelFilter = "all" | "info" | "warn" | "error";

export default function AdminPage() {
  const { user, refreshProducts } = useStore();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLevelFilter, setAuditLevelFilter] = useState<AuditLevelFilter>("all");
  const [auditEventFilter, setAuditEventFilter] = useState("");
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [copiedRequestId, setCopiedRequestId] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  async function fetchAuditLogs() {
    setIsLoadingLogs(true);

    const params = new URLSearchParams();
    params.set("limit", "25");
    params.set("page", String(auditPage));
    if (auditLevelFilter !== "all") {
      params.set("level", auditLevelFilter);
    }

    const eventFilter = auditEventFilter.trim();
    if (eventFilter) {
      params.set("event", eventFilter);
    }

    try {
      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setMessage("Audit loglar yuklenemedi.");
        return;
      }

      const logsData = (await response.json()) as {
        logs: AuditLog[];
        page: number;
        totalPages: number;
        total: number;
      };
      setAuditLogs(logsData.logs ?? []);
      setAuditPage(logsData.page || 1);
      setAuditTotalPages(logsData.totalPages || 1);
      setAuditTotal(logsData.total || 0);
    } catch {
      setMessage("Audit loglar yuklenemedi.");
    } finally {
      setIsLoadingLogs(false);
    }
  }

  async function copyRequestId(requestId: string) {
    try {
      await navigator.clipboard.writeText(requestId);
      setCopiedRequestId(requestId);
      window.setTimeout(() => {
        setCopiedRequestId("");
      }, 1400);
    } catch {
      setMessage("requestId kopyalanamadi.");
    }
  }

  async function uploadImages(files: File[]) {
    if (!files.length) {
      return;
    }

    setIsUploading(true);
    setUploadMessage("Gorseller yukleniyor...");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as {
      ok: boolean;
      urls?: string[];
      message?: string;
    };

    if (!response.ok || !data.ok || !data.urls?.length) {
      setUploadMessage(data.message || "Gorseller yuklenemedi.");
      setIsUploading(false);
      return;
    }

    const uploadedUrls = data.urls;

    setForm((prev) => {
      const existing = prev.gallery
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      const merged = Array.from(new Set([...existing, ...uploadedUrls]));

      return {
        ...prev,
        image: prev.image || uploadedUrls[0],
        gallery: merged.join("\n"),
      };
    });

    setUploadMessage(`${uploadedUrls.length} gorsel yuklendi.`);
    setIsUploading(false);
  }

  async function loadData() {
    const [overviewRes, productsRes, ordersRes] = await Promise.all([
      fetch("/api/admin/overview", { cache: "no-store" }),
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
    ]);

    if (!overviewRes.ok || !productsRes.ok || !ordersRes.ok) {
      setMessage("Admin yetkisi gerekli.");
      return;
    }

    const overviewData = (await overviewRes.json()) as { metrics: Metrics };
    const productsData = (await productsRes.json()) as { products: Product[] };
    const ordersData = (await ordersRes.json()) as { orders: AdminOrder[] };

    setMetrics(overviewData.metrics);
    setProducts(productsData.products);
    setOrders(ordersData.orders ?? []);
    await fetchAuditLogs();
  }

  useEffect(() => {
    if (!user?.isAdmin) {
      return;
    }

    let active = true;

    Promise.all([
      fetch("/api/admin/overview", { cache: "no-store" }),
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
    ])
      .then(async ([overviewRes, productsRes, ordersRes]) => {
        if (!overviewRes.ok || !productsRes.ok || !ordersRes.ok) {
          if (active) {
            setMessage("Admin yetkisi gerekli.");
          }
          return;
        }

        const overviewData = (await overviewRes.json()) as { metrics: Metrics };
        const productsData = (await productsRes.json()) as { products: Product[] };
        const ordersData = (await ordersRes.json()) as { orders: AdminOrder[] };

        if (active) {
          setMetrics(overviewData.metrics);
          setProducts(productsData.products);
          setOrders(ordersData.orders ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setMessage("Veriler yuklenemedi.");
        }
      });

    return () => {
      active = false;
    };
  }, [user?.isAdmin]);

  useEffect(() => {
    if (!user?.isAdmin) {
      return;
    }

    let active = true;

    const params = new URLSearchParams();
    params.set("limit", "25");
    if (auditLevelFilter !== "all") {
      params.set("level", auditLevelFilter);
    }

    const eventFilter = auditEventFilter.trim();
    if (eventFilter) {
      params.set("event", eventFilter);
    }

    fetch(`/api/admin/audit-logs?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          if (active) {
            setMessage("Audit loglar yuklenemedi.");
          }
          return;
        }

        const logsData = (await response.json()) as { logs: AuditLog[] };
        if (active) {
          setAuditLogs(logsData.logs ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setMessage("Audit loglar yuklenemedi.");
        }
      });

    return () => {
      active = false;
    };
  }, [user?.isAdmin, auditLevelFilter, auditEventFilter, auditPage]);

  const quickEvents = Array.from(new Set(auditLogs.map((log) => log.event))).slice(0, 8);

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!response.ok || !data.ok) {
      setMessage(data.message || "Urun olusturulamadi.");
      return;
    }

    setMessage("Urun eklendi.");
    setForm(initialForm);
    await loadData();
    await refreshProducts();
  }

  async function removeProduct(id: string) {
    const response = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!response.ok || !data.ok) {
      setMessage(data.message || "Urun silinemedi.");
      return;
    }

    setMessage("Urun silindi.");
    await loadData();
    await refreshProducts();
  }

  async function updateOrder(payload: {
    orderId: string;
    status: OrderStatus;
    cargoCompany: string;
    trackingCode: string;
  }) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!response.ok || !data.ok) {
      setMessage(data.message || "Siparis guncellenemedi.");
      return;
    }

    setMessage("Siparis guncellendi.");
    await loadData();
  }

  if (!user?.isAdmin) {
    return (
      <section className="page-shell">
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
          <article className="panel">
            <h1 className="section-title">Admin Panel</h1>
            <p className="section-sub">Bu alana sadece admin kullanicisi erisebilir.</p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 md:px-8">
        <h1 className="section-title">Admin Panel</h1>

        {metrics ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="panel">
              <p className="section-sub">Kullanicilar</p>
              <p className="text-2xl font-bold">{metrics.users}</p>
            </article>
            <article className="panel">
              <p className="section-sub">Urunler</p>
              <p className="text-2xl font-bold">{metrics.products}</p>
            </article>
            <article className="panel">
              <p className="section-sub">Siparisler</p>
              <p className="text-2xl font-bold">{metrics.orders}</p>
            </article>
            <article className="panel">
              <p className="section-sub">Toplam Ciro</p>
              <p className="text-2xl font-bold">{formatTry(metrics.revenue)}</p>
            </article>
          </div>
        ) : null}

        <form className="panel grid gap-3 md:grid-cols-2" onSubmit={createProduct}>
          <h2 className="section-title md:col-span-2">Yeni Urun Ekle</h2>
          <input className="input" placeholder="SKU (HV-200)" value={form.sku} onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))} required />
          <input className="input" placeholder="Urun Adi" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          <input className="input" placeholder="Kategori" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} required />
          <input className="input" placeholder="Gorsel URL" value={form.image} onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))} required />
          <input className="input" placeholder="Stok Adedi" type="number" min="0" value={form.stockCount} onChange={(e) => setForm((prev) => ({ ...prev, stockCount: Number(e.target.value) }))} required />
          <select
            className="input"
            value={form.stockStatus}
            onChange={(e) => setForm((prev) => ({ ...prev, stockStatus: e.target.value }))}
          >
            <option value="stokta">Stokta</option>
            <option value="az_stokta">Az Stok</option>
            <option value="tukendi">Tukendi</option>
          </select>
          <div
            className={`md:col-span-2 rounded-xl border-2 border-dashed p-4 text-sm ${isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragActive(false);
              const files = Array.from(e.dataTransfer.files || []);
              void uploadImages(files);
            }}
          >
            <p className="font-semibold text-slate-700">Gorselleri surukle-birak yapin</p>
            <p className="mt-1 text-slate-500">veya dosya sec ile bilgisayarinizdan yukleyin (jpg/png/webp, max 5MB).</p>
            <label className="btn btn-secondary mt-3 inline-flex cursor-pointer">
              Dosya Sec
              <input
                className="hidden"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  void uploadImages(files);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {isUploading ? <p className="mt-2 text-blue-700">Yukleniyor...</p> : null}
            {uploadMessage ? <p className="mt-2 text-emerald-700">{uploadMessage}</p> : null}
          </div>
          <textarea
            className="input md:col-span-2 min-h-[110px]"
            placeholder="Galeri URL (her satira bir gorsel URL yazin)"
            value={form.gallery}
            onChange={(e) => setForm((prev) => ({ ...prev, gallery: e.target.value }))}
          />
          <input className="input" placeholder="Perakende Fiyat" type="number" value={form.retailPrice} onChange={(e) => setForm((prev) => ({ ...prev, retailPrice: Number(e.target.value) }))} required />

          <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              checked={form.wholesaleEnabled}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  wholesaleEnabled: e.target.checked,
                }))
              }
            />
            Bu urunde toptan fiyat aktif
          </label>

          {form.wholesaleEnabled ? (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2">
              <p className="text-sm font-semibold text-slate-700">Toptan Kademe Fiyatlari</p>
              {form.wholesaleTiers.map((tier, index) => (
                <div key={`tier-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <input
                    className="input"
                    type="number"
                    placeholder="Min Adet"
                    value={tier.minQty}
                    onChange={(e) => {
                      const next = [...form.wholesaleTiers];
                      next[index] = { ...next[index], minQty: Number(e.target.value) };
                      setForm((prev) => ({ ...prev, wholesaleTiers: next }));
                    }}
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="Birim Fiyat"
                    value={tier.unitPrice}
                    onChange={(e) => {
                      const next = [...form.wholesaleTiers];
                      next[index] = { ...next[index], unitPrice: Number(e.target.value) };
                      setForm((prev) => ({ ...prev, wholesaleTiers: next }));
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const next = form.wholesaleTiers.filter((_, i) => i !== index);
                      setForm((prev) => ({
                        ...prev,
                        wholesaleTiers: next.length ? next : [{ minQty: 10, unitPrice: 0 }],
                      }));
                    }}
                  >
                    Sil
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    wholesaleTiers: [...prev.wholesaleTiers, { minQty: 10, unitPrice: 0 }],
                  }))
                }
              >
                Kademe Ekle
              </button>
            </div>
          ) : null}

          <input className="input" placeholder="Aciklama" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} required />
          <button className="btn btn-primary md:col-span-2" type="submit">Urun Kaydet</button>
        </form>

        <div className="panel space-y-3">
          <h2 className="section-title">Urun Listesi</h2>
          {products.map((item) => (
            <article key={item.id} className="cart-row">
              <div>
                <p className="font-semibold">{item.sku} - {item.name}</p>
                <p className="section-sub">{item.category} | Perakende: {formatTry(item.retailPrice)}</p>
                <p className="section-sub">
                  Stok Durumu: <span className={getStockStatusClass(item.stockStatus)}>{getStockStatusLabel(item.stockStatus)}</span>
                </p>
                <p className="section-sub">Stok Adedi: {getStockCountLabel(item.stockCount)}</p>
                <p className="section-sub">Galeri: {item.gallery?.length || 1} gorsel</p>
                {item.wholesaleEnabled && item.wholesaleTiers?.length ? (
                  <div className="text-xs text-slate-500">
                    {(item.wholesaleTiers as WholesaleTier[]).map((tier) => (
                      <p key={`${item.id}-${tier.minQty}`}>
                        {tier.minQty}+ adet: {formatTry(tier.unitPrice)}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">Toptan satis yok</p>
                )}
              </div>
              <button className="btn btn-secondary" onClick={() => void removeProduct(item.id)}>
                Sil
              </button>
            </article>
          ))}
        </div>

        <div className="panel space-y-3">
          <h2 className="section-title">Siparis Yonetimi</h2>
          {orders.map((order) => (
            <article key={order.id} className="cart-row">
              <div className="space-y-1">
                <p className="font-semibold">{order.id}</p>
                <p className="section-sub">{order.user.name} ({order.user.email})</p>
                <p className="section-sub">Toplam: {formatTry(order.total)}</p>
              </div>
              <OrderUpdateForm
                order={order}
                onSave={updateOrder}
              />
            </article>
          ))}
        </div>

        <div className="panel space-y-3">
          <h2 className="section-title">Audit Log (Son 25 Olay)</h2>
          <div className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
            <select
              className="input"
              value={auditLevelFilter}
              onChange={(e) => {
                setAuditPage(1);
                setAuditLevelFilter(e.target.value as AuditLevelFilter);
              }}
            >
              <option value="all">Tum Seviyeler</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
            <input
              className="input"
              placeholder="Event ara (ornek: payment.webhook)"
              value={auditEventFilter}
              onChange={(e) => {
                setAuditPage(1);
                setAuditEventFilter(e.target.value);
              }}
            />
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => void fetchAuditLogs()}
              disabled={isLoadingLogs}
            >
              {isLoadingLogs ? "Yukleniyor..." : "Yenile"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`menu-chip ${auditEventFilter === "" ? "menu-chip-active" : ""}`}
              onClick={() => {
                setAuditPage(1);
                setAuditEventFilter("");
              }}
            >
              Tum Eventler
            </button>
            {quickEvents.map((event) => (
              <button
                key={event}
                type="button"
                className={`menu-chip ${auditEventFilter === event ? "menu-chip-active" : ""}`}
                onClick={() => {
                  setAuditPage(1);
                  setAuditEventFilter(event);
                }}
              >
                {event}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {auditLogs.length ? (
              auditLogs.map((log) => (
                <article key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${log.level === "error" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-slate-500">{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
                    <span className="text-slate-500">{log.method}</span>
                    <span className="text-slate-500">{log.route}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{log.event}</p>
                  {log.message ? <p className="text-sm text-slate-600">{log.message}</p> : null}
                  <p className="text-xs text-slate-500">userId: {log.userId || "-"}</p>
                  <p className="text-xs text-slate-500">ip: {log.ip || "-"}</p>
                  <p className="text-xs text-slate-500">userAgent: {log.userAgent || "-"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-xs text-slate-500">requestId: {log.requestId}</p>
                    <button
                      type="button"
                      className="menu-chip"
                      onClick={() => void copyRequestId(log.requestId)}
                    >
                      {copiedRequestId === log.requestId ? "Kopyalandi" : "Kopyala"}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">Henuz audit kaydi bulunmuyor.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-500">
              Sayfa {auditPage}/{auditTotalPages} - Toplam {auditTotal} kayit
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="menu-chip"
                disabled={auditPage <= 1}
                onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
              >
                Onceki
              </button>
              <button
                type="button"
                className="menu-chip"
                disabled={auditPage >= auditTotalPages}
                onClick={() => setAuditPage((prev) => Math.min(auditTotalPages, prev + 1))}
              >
                Sonraki
              </button>
            </div>
          </div>
        </div>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      </div>
    </section>
  );
}

function OrderUpdateForm({
  order,
  onSave,
}: {
  order: AdminOrder;
  onSave: (payload: {
    orderId: string;
    status: OrderStatus;
    cargoCompany: string;
    trackingCode: string;
  }) => Promise<void>;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [cargoCompany, setCargoCompany] = useState(order.cargoCompany || "");
  const [trackingCode, setTrackingCode] = useState(order.trackingCode || "");
  const carriers = ["Yurtici Kargo", "Aras Kargo", "MNG Kargo"];

  return (
    <form
      className="grid w-full max-w-xl gap-2 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({
          orderId: order.id,
          status,
          cargoCompany,
          trackingCode,
        });
      }}
    >
      <select
        className="input"
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
      >
        <option value="odeme_alindi">{orderStatusLabel.odeme_alindi}</option>
        <option value="hazirlaniyor">{orderStatusLabel.hazirlaniyor}</option>
        <option value="kargoda">{orderStatusLabel.kargoda}</option>
        <option value="teslim_edildi">{orderStatusLabel.teslim_edildi}</option>
        <option value="iptal">{orderStatusLabel.iptal}</option>
      </select>
      <select
        className="input"
        value={cargoCompany}
        onChange={(e) => setCargoCompany(e.target.value)}
      >
        <option value="">Kargo Firmasi Sec</option>
        {carriers.map((carrier) => (
          <option key={carrier} value={carrier}>
            {carrier}
          </option>
        ))}
      </select>
      <input
        className="input md:col-span-2"
        placeholder="Takip Kodu"
        value={trackingCode}
        onChange={(e) => setTrackingCode(e.target.value)}
      />
      <button className="btn btn-primary md:col-span-2" type="submit">
        Siparisi Guncelle
      </button>
    </form>
  );
}
