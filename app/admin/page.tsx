"use client";

import * as XLSX from "xlsx";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminAnnouncementsPanel } from "@/components/admin-announcements-panel";
import { AdminNewsletterPanel } from "@/components/admin-newsletter-panel";
import { useStore } from "@/components/store-provider";
import { getImageSource } from "@/lib/image-fallback";
import { formatTry } from "@/lib/money";
import { orderStatusClass, orderStatusLabel, type OrderStatus } from "@/lib/order-status";
import { buildOrderReceiptHtml, getOrderWorkflowActions, resolveOrderStatusFromAction } from "@/lib/order-workflow";
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
  shippedAt?: string | null;
  deliveredAt?: string | null;
  items?: Array<{ id: string; name: string; quantity: number; unitPrice: number; lineTotal: number }>;
  shippingAddress?: {
    fullName?: string | null;
    phone?: string | null;
    city?: string | null;
    district?: string | null;
    address?: string | null;
    postalCode?: string | null;
  } | null;
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
type AdminTab = "overview" | "products" | "orders" | "announcements" | "newsletter" | "logs";
type ProductTab = "create" | "list";
type ProductFormState = typeof initialForm;

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
  const [uploadMessageTone, setUploadMessageTone] = useState<"success" | "error" | "info">("info");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [productTab, setProductTab] = useState<ProductTab>("create");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | OrderStatus>("all");
  const [orderCarrierFilter, setOrderCarrierFilter] = useState("all");
  const [orderPage, setOrderPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [bulkUploadMessage, setBulkUploadMessage] = useState("");
  const [bulkValidationMessage, setBulkValidationMessage] = useState("");
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [selectedBulkFile, setSelectedBulkFile] = useState<File | null>(null);
  const [bulkPreviewRows, setBulkPreviewRows] = useState<Array<Record<string, unknown>>>([]);
  const [bulkPreviewSummary, setBulkPreviewSummary] = useState("");
  const [bulkImportResult, setBulkImportResult] = useState<{ createdCount: number; updatedCount: number; failedCount: number; duplicateCount: number; errors: Array<{ row: number; sku: string; reason: string }> } | null>(null);

  const orderSummary = useMemo(() => {
    const counts = orders.reduce<Record<OrderStatus, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {
      odeme_alindi: 0,
      hazirlaniyor: 0,
      kargoda: 0,
      teslim_edildi: 0,
      iptal: 0,
    });

    return {
      total: orders.length,
      pending: counts.odeme_alindi,
      shipping: counts.kargoda,
      delivered: counts.teslim_edildi,
      cancelled: counts.iptal,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    return orders
      .filter((order) => {
        const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
        const matchesCarrier = orderCarrierFilter === "all" || (order.cargoCompany || "").toLowerCase() === orderCarrierFilter.toLowerCase();
        const haystack = [
          order.id,
          order.user.name,
          order.user.email,
          order.cargoCompany || "",
          order.trackingCode || "",
          order.items?.map((item) => item.name).join(" ") || "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery = !query || haystack.includes(query);
        return matchesStatus && matchesCarrier && matchesQuery;
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [orderCarrierFilter, orderSearch, orderStatusFilter, orders]);

  const orderPageSize = 6;
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / orderPageSize));
  const paginatedOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * orderPageSize;
    return filteredOrders.slice(startIndex, startIndex + orderPageSize);
  }, [filteredOrders, orderPage]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch, orderStatusFilter, orderCarrierFilter]);

  useEffect(() => {
    if (orderPage > totalOrderPages) {
      setOrderPage(totalOrderPages);
    }
  }, [orderPage, totalOrderPages]);

  function productToForm(product: Product): ProductFormState {
    return {
      sku: product.sku || "",
      name: product.name || "",
      category: product.category || "",
      image: product.image || "",
      gallery: Array.isArray(product.gallery) ? product.gallery.join("\n") : String(product.gallery || ""),
      retailPrice: Number(product.retailPrice || 0),
      stockCount: Number(product.stockCount || 0),
      stockStatus: product.stockStatus || "stokta",
      wholesaleEnabled: Boolean(product.wholesaleEnabled),
      wholesaleTiers: product.wholesaleTiers?.length
        ? product.wholesaleTiers.map((tier) => ({ minQty: tier.minQty, unitPrice: tier.unitPrice }))
        : [{ minQty: 10, unitPrice: 0 }],
      description: product.description || "",
    };
  }

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setForm(productToForm(product));
    setActiveTab("products");
    setProductTab("create");
    setMessage("Ürün bilgileri düzenleme için yüklendi.");
  }

  function cancelEditProduct() {
    setEditingProductId(null);
    setForm(initialForm);
  }

  async function previewBulkFile(file: File) {
    setSelectedBulkFile(file);
    setBulkPreviewRows([]);
    setBulkPreviewSummary("");
    setBulkValidationMessage("");
    setBulkUploadMessage("");

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setBulkValidationMessage("Lütfen .xlsx, .xls veya .csv uzantılı bir dosya seçin.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const isCsv = /\.csv$/i.test(file.name) || file.type.includes("csv");
      const workbook = isCsv
        ? XLSX.read(new TextDecoder("utf-8").decode(buffer), { type: "string" })
        : XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        setBulkValidationMessage("Dosyada satir bulunamadi.");
        return;
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (!rows.length) {
        setBulkValidationMessage("Dosyada satir bulunamadi.");
        return;
      }

      const columns = Object.keys(rows[0] ?? {});
      const requiredColumns = ["sku", "name"];
      const missingColumns = requiredColumns.filter((column) => !columns.some((item) => item.toLowerCase() === column));
      const previewRows = rows.slice(0, 5).map((row) => {
        const preview: Record<string, unknown> = {};
        Object.entries(row).forEach(([key, value]) => {
          preview[key] = value ?? "";
        });
        return preview;
      });

      setBulkPreviewRows(previewRows);
      setBulkPreviewSummary(`${rows.length} satır bulundu. ${missingColumns.length ? `Eksik alanlar: ${missingColumns.join(", ")}` : "Gerekli alanlar mevcut."}`);
      setBulkValidationMessage(missingColumns.length ? `Eksik alanlar: ${missingColumns.join(", ")}` : "Dosya hazır. Yüklemeyi başlatabilirsiniz.");
    } catch {
      setBulkValidationMessage("Dosya okunamadı. Lütfen farklı bir dosya deneyin.");
    }
  }

  function downloadBulkErrorsCsv() {
    if (!bulkImportResult?.errors?.length) {
      return;
    }

    const rows = [
      ["row", "sku", "reason"],
      ...bulkImportResult.errors.map((error) => [String(error.row), error.sku || "", error.reason]),
    ];

    const csvContent = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk-import-errors.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function uploadBulkProducts(file: File) {
    if (!file) {
      return;
    }

    setIsBulkUploading(true);
setBulkUploadMessage("Excel/CSV dosyası yükleniyor...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        createdCount?: number;
        updatedCount?: number;
        failedCount?: number;
        duplicateCount?: number;
        errors?: Array<{ row: number; sku: string; reason: string }>;
      };

      if (!response.ok || !data.ok) {
        setBulkUploadMessage(data.message || "Excel yüklenemedi.");
        return;
      }

      setBulkImportResult({
        createdCount: data.createdCount || 0,
        updatedCount: data.updatedCount || 0,
        failedCount: data.failedCount || 0,
        duplicateCount: data.duplicateCount || 0,
        errors: data.errors || [],
      });
      setBulkUploadMessage(data.message || `${data.createdCount || 0} ürün eklendi, ${data.failedCount || 0} satır atlandı.`);
      setBulkPreviewRows([]);
      setBulkPreviewSummary("");
      setBulkValidationMessage("");
      setSelectedBulkFile(null);
      await loadData();
      await refreshProducts();
      setMessage("Toplu ürün yükleme tamamlandı. Liste yenilendi.");
    } catch {
      setBulkUploadMessage("Excel yüklenemedi.");
    } finally {
      setIsBulkUploading(false);
    }
  }

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
    setUploadMessageTone("info");
    setUploadMessage("Görseller yükleniyor...");

    try {
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
        setUploadMessageTone("error");
        setUploadMessage(data.message || "Gorseller yuklenemedi.");
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

      setUploadMessageTone("success");
      setUploadMessage(data.message || `${uploadedUrls.length} görsel yüklendi.`);
    } catch {
      setUploadMessageTone("error");
      setUploadMessage("Gorseller yuklenirken baglanti hatasi olustu.");
    } finally {
      setIsUploading(false);
    }
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
  const normalizedProductSearch = productSearch.trim().toLowerCase();
  const visibleProducts = normalizedProductSearch
    ? products.filter((item) => {
        const haystack = [item.sku, item.name, item.category, item.description].join(" ").toLowerCase();
        return haystack.includes(normalizedProductSearch);
      })
    : products;

  async function createProduct(e: FormEvent) {
    e.preventDefault();

    console.info("[admin-product-submit]", JSON.stringify({
      editingProductId,
      formImage: form.image,
      formGallery: form.gallery,
      formSku: form.sku,
    }));

    const payload = {
      ...(editingProductId ? { id: editingProductId } : {}),
      ...form,
      image: form.image || (form.gallery ? form.gallery.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)[0] || "" : ""),
      gallery: form.gallery || (form.image ? form.image : ""),
    };

    const response = await fetch("/api/admin/products", {
      method: editingProductId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!response.ok || !data.ok) {
      setMessage(data.message || (editingProductId ? "Ürün güncellenemedi." : "Ürün oluşturulamadı."));
      return;
    }

    setMessage(editingProductId ? "Ürün güncellendi." : "Ürün eklendi.");
    setForm(initialForm);
    setEditingProductId(null);
    setUploadMessage("");
    await loadData();
    await refreshProducts();
  }

  async function removeProduct(id: string) {
    const confirmed = window.confirm("Ürünü silmek istediğinizden emin misiniz?");
    if (!confirmed) {
      return;
    }

    const response = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!response.ok || !data.ok) {
      setMessage(data.message || "Ürün silinemedi.");
      return;
    }

    setMessage("Ürün silindi.");
    await loadData();
    await refreshProducts();
  }

  async function updateOrder(payload: {
    orderId: string;
    status: OrderStatus;
    cargoCompany: string;
    trackingCode: string;
    reason?: string;
  }) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { ok: boolean; message?: string };
    if (!response.ok || !data.ok) {
      setMessage(data.message || "Sipariş güncellenemedi.");
      return;
    }

    setMessage("Sipariş güncellendi.");
    await loadData();
  }

  function downloadOrderReceipt(order: AdminOrder) {
    const receiptOrder = {
      ...order,
      items: order.items?.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })) || [],
      shippingAddress: order.shippingAddress
        ? {
            fullName: order.shippingAddress.fullName || order.user?.name || "-",
            phone: order.shippingAddress.phone || "-",
            city: order.shippingAddress.city || "-",
            district: order.shippingAddress.district || "-",
            address: order.shippingAddress.address || "-",
            postalCode: order.shippingAddress.postalCode || "-",
          }
        : {
            fullName: order.user?.name || "-",
            phone: "-",
            city: "-",
            district: "-",
            address: "-",
            postalCode: "-",
          },
    };

    const receiptHtml = buildOrderReceiptHtml(receiptOrder, order.user, `${window.location.origin}/logo.jpg`);
    const receiptBlob = new Blob([receiptHtml], { type: "text/html;charset=utf-8" });
    const receiptUrl = URL.createObjectURL(receiptBlob);
    const popup = window.open(receiptUrl, "_blank", "noopener,noreferrer");

    if (!popup) {
      window.location.assign(receiptUrl);
      return;
    }

    setTimeout(() => {
      try {
        popup.focus();
        popup.print();
      } catch {
        // Browser may block print immediately; the receipt page is still available.
      }
      setTimeout(() => URL.revokeObjectURL(receiptUrl), 2000);
    }, 300);
  }

  async function quickUpdateOrder(order: AdminOrder, nextStatus: OrderStatus) {
    if (nextStatus === "kargoda" && !order.trackingCode) {
      setMessage("Kargoya verme için önce takip kodu ekleyin.");
      return;
    }

    if (nextStatus === "iptal") {
      const confirmed = window.confirm("Siparişi iptal etmek istediğinizden emin misiniz?");
      if (!confirmed) {
        return;
      }
    }

    await updateOrder({
      orderId: order.id,
      status: nextStatus,
      cargoCompany: order.cargoCompany || "",
      trackingCode: order.trackingCode || "",
      reason: nextStatus === "iptal" ? "İptal edildi" : undefined,
    });
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
              <p className="mt-1 text-sm text-slate-600">Aktif hesaplar ve admin erişim durumu.</p>
            </article>
            <article className="panel">
              <p className="section-sub">Ürünler</p>
              <p className="text-2xl font-bold">{metrics.products}</p>
              <p className="mt-1 text-sm text-slate-600">Katalogda bulunan aktif ürün sayısı.</p>
            </article>
            <article className="panel">
              <p className="section-sub">Siparisler</p>
              <p className="text-2xl font-bold">{metrics.orders}</p>
              <p className="mt-1 text-sm text-slate-600">Toplam işlem ve sipariş takibi.</p>
            </article>
            <article className="panel">
              <p className="section-sub">Toplam Ciro</p>
              <p className="text-2xl font-bold">{formatTry(metrics.revenue)}</p>
              <p className="mt-1 text-sm text-slate-600">Tamamlanan satışların genel toplamı.</p>
            </article>
          </div>
        ) : null}

        <div className="panel space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            {[
              ["overview", "Genel"],
              ["products", "Ürünler"],
              ["orders", "Siparisler"],
              ["announcements", "Duyurular"],
              ["newsletter", "Bulten"],
              ["logs", "Loglar"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`menu-chip ${activeTab === key ? "menu-chip-active" : ""}`}
                onClick={() => setActiveTab(key as AdminTab)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "overview" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="section-title">Hızlı Erişim</h2>
                <p className="section-sub">Sık kullanılan alanlara bir tıkla geçiş yap.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-primary" onClick={() => setActiveTab("products")}>Ürünler</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveTab("orders")}>Siparişler</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveTab("announcements")}>Duyurular</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveTab("logs")}>Loglar</button>
                </div>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="section-title">Operasyon Özeti</h2>
                <p className="section-sub">Toplu ürün yükleme, sipariş akışı ve duyuru yönetimi artık daha görünür.</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>• Toplu yükleme için Excel/CSV desteği hazır.</li>
                  <li>• Sipariş aşamaları hızlıca güncellenebilir.</li>
                  <li>• Duyuru ve e-posta paneli ayrı sekmelerde.</li>
                </ul>
              </article>
            </div>
          ) : null}

          {activeTab === "products" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button type="button" className={`menu-chip ${productTab === "create" ? "menu-chip-active" : ""}`} onClick={() => setProductTab("create")}>Ürün Ekle</button>
                <button type="button" className={`menu-chip ${productTab === "list" ? "menu-chip-active" : ""}`} onClick={() => setProductTab("list")}>Ürün Listesi</button>
              </div>

              {productTab === "create" ? (
                <div className="space-y-4">
                  <div className="panel space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="section-title">Toplu Ürün Yükle</h2>
                        <p className="section-sub">Excel veya CSV dosyası ile birden fazla ürünü önce ön izleme sonra tek seferde ekle.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a className="btn btn-secondary" href="/api/admin/products/bulk/template">
                          Sablon Indir
                        </a>
                        <label className="btn btn-secondary cursor-pointer">
                          Dosya Sec
                          <input
                            className="hidden"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                void previewBulkFile(file);
                              }
                              e.currentTarget.value = "";
                            }}
                          />
                        </label>
                        {selectedBulkFile ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              if (selectedBulkFile) {
                                void uploadBulkProducts(selectedBulkFile);
                              }
                            }}
                            disabled={isBulkUploading}
                          >
                            {isBulkUploading ? "Yükleniyor..." : "Yüklemeyi Başlat"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="font-semibold text-slate-700">Beklenen kolonlar</p>
                      <p>sku, name, category, image, gallery, retailPrice, stockCount, stockStatus, wholesaleEnabled, description, active, wholesaleTiers</p>
                      <p className="mt-2">gallery her satira URL ya da virgul ayracli liste olabilir. wholesaleTiers JSON dizi olarak girilebilir.</p>
                    </div>
                    {selectedBulkFile ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-700">Secilen dosya</p>
                        <p>{selectedBulkFile.name}</p>
                        {bulkPreviewSummary ? <p className="mt-2 text-slate-600">{bulkPreviewSummary}</p> : null}
                      </div>
                    ) : null}
                    {bulkValidationMessage ? <p className="text-amber-700">{bulkValidationMessage}</p> : null}
                    {bulkPreviewRows.length ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3">
                        <p className="mb-2 font-semibold text-slate-700">Ön izleme (ilk 5 satır)</p>
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-600">
                              {Object.keys(bulkPreviewRows[0]).map((key) => (
                                <th key={key} className="whitespace-nowrap px-2 py-2">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {bulkPreviewRows.map((row, index) => (
                              <tr key={`${Object.values(row).join("-")}-${index}`} className="border-b border-slate-100">
                                {Object.entries(row).map(([key, value]) => (
                                  <td key={`${key}-${index}`} className="px-2 py-2 text-slate-700">
                                    {String(value ?? "")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                    {isBulkUploading ? <p className="text-blue-700">Yükleniyor...</p> : null}
                    {bulkUploadMessage ? <p className="text-emerald-700">{bulkUploadMessage}</p> : null}
                    {bulkImportResult ? (
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                          <p className="font-semibold">Başarılı</p>
                          <p className="text-2xl font-bold">{bulkImportResult.createdCount}</p>
                        </div>
                        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                          <p className="font-semibold">Güncellendi</p>
                          <p className="text-2xl font-bold">{bulkImportResult.updatedCount}</p>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                          <p className="font-semibold">Başarısız</p>
                          <p className="text-2xl font-bold">{bulkImportResult.failedCount}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          <p className="font-semibold">Çift / Atlanan</p>
                          <p className="text-2xl font-bold">{bulkImportResult.duplicateCount}</p>
                        </div>
                      </div>
                    ) : null}
                    {bulkImportResult?.errors?.length ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">Hatalı satırlar</p>
                          <button type="button" className="btn btn-secondary px-3 py-2 text-xs" onClick={downloadBulkErrorsCsv}>
                            CSV İndir
                          </button>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {bulkImportResult.errors.map((error, index) => (
                            <li key={`${error.row}-${index}`}>
                              Satır {error.row}: {error.sku || "SKU yok"} — {error.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>

                  <form className="panel grid gap-3 md:grid-cols-2" onSubmit={createProduct}>
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="section-title">{editingProductId ? "Ürün Düzenle" : "Yeni Ürün Ekle"}</h2>
                    {editingProductId ? (
                      <button type="button" className="btn btn-secondary" onClick={cancelEditProduct}>
                        Düzenlemeyi İptal Et
                      </button>
                    ) : null}
                  </div>
                  <input className="input" placeholder="SKU (HV-200)" value={form.sku} onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))} required />
                  <input className="input" placeholder="Ürün Adı" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                  <input className="input" placeholder="Kategori" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} required />
                  <div className="space-y-1">
                    <input className="input" placeholder="Gorsel URL" value={form.image} onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))} required />
                    <p className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">Ana Gorsel: Urunler sayfasinda gorunecek gorsel</p>
                  </div>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span>Perakende fiyat</span>
                    <input className="input" type="number" min="0" value={form.retailPrice} onChange={(e) => setForm((prev) => ({ ...prev, retailPrice: Number(e.target.value) }))} required />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span>Stok adedi</span>
                    <input className="input" type="number" min="0" value={form.stockCount} onChange={(e) => setForm((prev) => ({ ...prev, stockCount: Number(e.target.value) }))} required />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                    <span>Stok durumu</span>
                    <select className="input" value={form.stockStatus} onChange={(e) => setForm((prev) => ({ ...prev, stockStatus: e.target.value }))}>
                      <option value="stokta">Stokta</option>
                      <option value="az_stokta">Az Stok</option>
                      <option value="tukendi">Tukendi</option>
                    </select>
                  </label>
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
                    <p className="font-semibold text-slate-700">Görselleri sürükle-bırak yapın</p>
                    <p className="mt-1 text-slate-500">veya dosya seç ile bilgisayarınızdan yükleyin (jpg/png/webp, max 5MB).</p>
                    <label className="btn btn-secondary mt-3 inline-flex cursor-pointer">
                      Dosya Sec
                      <input
                        className="hidden"
                        type="file"
                        accept=".jpg,.png,.webp,image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          void uploadImages(files);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {isUploading ? <p className="mt-2 text-blue-700">Yükleniyor...</p> : null}
                    {uploadMessage ? (
                      <p className={`mt-2 ${uploadMessageTone === "error" ? "text-rose-700" : uploadMessageTone === "success" ? "text-emerald-700" : "text-blue-700"}`}>
                        {uploadMessage}
                      </p>
                    ) : null}
                  </div>
                  <textarea className="input md:col-span-2 min-h-[110px]" placeholder="Galeri URL (her satira bir gorsel URL yazin)" value={form.gallery} onChange={(e) => setForm((prev) => ({ ...prev, gallery: e.target.value }))} />
                  <p className="md:col-span-2 text-xs text-slate-500">Renk varyanti icin satir formati: Renk|URL. Ayrica Renk - URL, Renk::URL ve Renk : URL da desteklenir.</p>
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
                    Bu üründe toptan fiyat aktif
                  </label>

                  {form.wholesaleEnabled ? (
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                      <p className="text-sm font-semibold text-slate-700">Toptan Kademe Fiyatlari</p>
                      {form.wholesaleTiers.map((tier, index) => (
                        <div key={`tier-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                          <input className="input" type="number" placeholder="Min Adet" value={tier.minQty} onChange={(e) => {
                            const next = [...form.wholesaleTiers];
                            next[index] = { ...next[index], minQty: Number(e.target.value) };
                            setForm((prev) => ({ ...prev, wholesaleTiers: next }));
                          }} />
                          <input className="input" type="number" placeholder="Birim Fiyat" value={tier.unitPrice} onChange={(e) => {
                            const next = [...form.wholesaleTiers];
                            next[index] = { ...next[index], unitPrice: Number(e.target.value) };
                            setForm((prev) => ({ ...prev, wholesaleTiers: next }));
                          }} />
                          <button type="button" className="btn btn-secondary" onClick={() => {
                            const next = form.wholesaleTiers.filter((_, i) => i !== index);
                            setForm((prev) => ({
                              ...prev,
                              wholesaleTiers: next.length ? next : [{ minQty: 10, unitPrice: 0 }],
                            }));
                          }}>Sil</button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-primary" onClick={() => setForm((prev) => ({
                        ...prev,
                        wholesaleTiers: [...prev.wholesaleTiers, { minQty: 10, unitPrice: 0 }],
                      }))}>
                        Kademe Ekle
                      </button>
                    </div>
                  ) : null}

                  <input className="input" placeholder="Aciklama" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} required />
                  <button className="btn btn-primary md:col-span-2" type="submit">{editingProductId ? "Ürünü Güncelle" : "Ürün Kaydet"}</button>
                </form>
                </div>
              ) : null}

              {productTab === "list" ? (
                <div className="panel space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="section-title">Ürün Listesi</h2>
                      <p className="section-sub">Ürün ismi, SKU, kategori veya açıklamada arama yap.</p>
                    </div>
                    <input
                      className="input w-full max-w-sm"
                      placeholder="Ürün ara"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  {visibleProducts.length ? (
                    <div className="grid gap-3 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2">
                      {visibleProducts.map((item) => (
                        <article key={item.id} className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm ${editingProductId === item.id ? "border-blue-300 bg-blue-50" : ""}`}>
                          <img
                            src={getImageSource(item.image)}
                            alt={item.name}
                            className="mb-3 h-28 w-full rounded-xl border border-slate-200 object-cover"
                            loading="lazy"
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                            <p className="text-xs text-slate-500">{item.category}</p>
                            <p className="text-xs text-slate-600">{formatTry(item.retailPrice)}</p>
                            <p className="text-xs text-slate-600">
                              <span className={getStockStatusClass(item.stockStatus)}>{getStockStatusLabel(item.stockStatus)}</span>
                            </p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button className="btn btn-primary px-2 py-1 text-xs" type="button" onClick={() => startEditProduct(item)}>
                              Duzenle
                            </button>
                            <button className="btn btn-secondary px-2 py-1 text-xs" type="button" onClick={() => void removeProduct(item.id)}>
                              Sil
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Aramana uygun ürün bulunamadı.</p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "orders" ? (
            <div className="panel space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="section-title">Sipariş Operasyon Merkezi</h2>
                  <p className="section-sub">Onay, hazırlık, kargo ve teslim adımlarını tek ekranda yönetin.</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
                  {filteredOrders.length}/{orders.length} sipariş
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Toplam</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{orderSummary.total}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Bekleyen</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-900">{orderSummary.pending}</p>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-sky-700">Kargoda</p>
                  <p className="mt-1 text-2xl font-semibold text-sky-900">{orderSummary.shipping}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Teslim</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-900">{orderSummary.delivered}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
                <label className="space-y-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Sipariş ara</span>
                  <input
                    className="input w-full"
                    placeholder="Müşteri, sipariş no veya ürün"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Durum</span>
                  <select className="input w-full" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value as "all" | OrderStatus)}>
                    <option value="all">Tümü</option>
                    <option value="odeme_alindi">{orderStatusLabel.odeme_alindi}</option>
                    <option value="hazirlaniyor">{orderStatusLabel.hazirlaniyor}</option>
                    <option value="kargoda">{orderStatusLabel.kargoda}</option>
                    <option value="teslim_edildi">{orderStatusLabel.teslim_edildi}</option>
                    <option value="iptal">{orderStatusLabel.iptal}</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Kargo firması</span>
                  <select className="input w-full" value={orderCarrierFilter} onChange={(e) => setOrderCarrierFilter(e.target.value)}>
                    <option value="all">Tümü</option>
                    <option value="yurtici kargo">Yurtici Kargo</option>
                    <option value="aras kargo">Aras Kargo</option>
                    <option value="mng kargo">MNG Kargo</option>
                  </select>
                </label>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-semibold">Sipariş</th>
                      <th className="px-3 py-3 font-semibold">Müşteri</th>
                      <th className="px-3 py-3 font-semibold">Tarih</th>
                      <th className="px-3 py-3 font-semibold">Toplam</th>
                      <th className="px-3 py-3 font-semibold">Durum</th>
                      <th className="px-3 py-3 font-semibold">Kargo</th>
                      <th className="px-3 py-3 font-semibold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.length ? (
                      paginatedOrders.map((order) => (
                        <tr key={order.id} className="border-t border-slate-200 align-top">
                          <td className="px-3 py-3">
                            <p className="font-semibold text-slate-900">{order.id}</p>
                            <p className="mt-1 text-xs text-slate-500">{order.items?.length ? `${order.items.length} ürün` : "Ürün yok"}</p>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-slate-800">{order.user.name}</p>
                            <p className="text-xs text-slate-500">{order.user.email}</p>
                          </td>
                          <td className="px-3 py-3 text-slate-600">{new Date(order.createdAt).toLocaleString("tr-TR")}</td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{formatTry(order.total)}</td>
                          <td className="px-3 py-3">
                            <span className={orderStatusClass(order.status)}>{orderStatusLabel[order.status]}</span>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-slate-800">{order.cargoCompany || "—"}</p>
                            <p className="text-xs text-slate-500">{order.trackingCode || "Takip kodu yok"}</p>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" className="btn btn-success px-2 py-1 text-xs" onClick={() => void quickUpdateOrder(order, "hazirlaniyor")}>
                                Onayla
                              </button>
                              <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={() => void quickUpdateOrder(order, "iptal")}>
                                İptal Et
                              </button>
                              <button type="button" className="btn btn-primary px-2 py-1 text-xs" onClick={() => downloadOrderReceipt(order)}>
                                Makbuz
                              </button>
                              <button type="button" className="menu-chip px-2 py-1 text-xs" onClick={() => setExpandedOrderId((prev) => prev === order.id ? null : order.id)}>
                                {expandedOrderId === order.id ? "Kapat" : "Düzenle"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-600">
                          Bu filtreye uygun sipariş bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredOrders.length ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
                  <p className="text-sm text-slate-600">Sayfa {orderPage}/{totalOrderPages}</p>
                  <div className="flex gap-2">
                    <button type="button" className="menu-chip" disabled={orderPage <= 1} onClick={() => setOrderPage((prev) => Math.max(1, prev - 1))}>
                      Önceki
                    </button>
                    <button type="button" className="menu-chip" disabled={orderPage >= totalOrderPages} onClick={() => setOrderPage((prev) => Math.min(totalOrderPages, prev + 1))}>
                      Sonraki
                    </button>
                  </div>
                </div>
              ) : null}

              {expandedOrderId ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {(() => {
                    const order = orders.find((item) => item.id === expandedOrderId);
                    if (!order) {
                      return null;
                    }

                    return (
                      <OrderUpdateForm
                        order={order}
                        onSave={updateOrder}
                        onDownloadReceipt={() => downloadOrderReceipt(order)}
                      />
                    );
                  })()}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "announcements" ? <AdminAnnouncementsPanel /> : null}

          {activeTab === "newsletter" ? <AdminNewsletterPanel /> : null}

          {activeTab === "logs" ? (
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
                <button className="btn btn-secondary" type="button" onClick={() => void fetchAuditLogs()} disabled={isLoadingLogs}>
                  {isLoadingLogs ? "Yükleniyor..." : "Yenile"}
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
                        <button type="button" className="menu-chip" onClick={() => void copyRequestId(log.requestId)}>
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
                  <button type="button" className="menu-chip" disabled={auditPage <= 1} onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}>
                    Onceki
                  </button>
                  <button type="button" className="menu-chip" disabled={auditPage >= auditTotalPages} onClick={() => setAuditPage((prev) => Math.min(auditTotalPages, prev + 1))}>
                    Sonraki
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}

function OrderUpdateForm({
  order,
  onSave,
  onDownloadReceipt,
}: {
  order: AdminOrder;
  onSave: (payload: {
    orderId: string;
    status: OrderStatus;
    cargoCompany: string;
    trackingCode: string;
    reason?: string;
  }) => Promise<void>;
  onDownloadReceipt: () => void;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [cargoCompany, setCargoCompany] = useState(order.cargoCompany || "");
  const [trackingCode, setTrackingCode] = useState(order.trackingCode || "");
  const [reason, setReason] = useState("");
  const carriers = ["Yurtici Kargo", "Aras Kargo", "MNG Kargo"];
  const workflowActions = getOrderWorkflowActions(status);

  return (
    <form
      className="grid w-full gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({
          orderId: order.id,
          status,
          cargoCompany,
          trackingCode,
          reason: reason.trim() || undefined,
        });
      }}
    >
      <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Sipariş işlemleri</p>
        <p className="mt-1">Durum, kargo firması ve takip kodu güncelleyebilirsiniz.</p>
      </div>
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
      {(status === "iptal" || status === "hazirlaniyor" || status === "odeme_alindi") ? (
        <textarea
          className="input md:col-span-2 min-h-[80px]"
          placeholder="İptal / stok sorunu notu"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      ) : null}
      <div className="md:col-span-2 flex flex-wrap gap-2">
        {workflowActions.length ? workflowActions.map((action) => (
          <button
            key={action.action}
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setStatus(resolveOrderStatusFromAction(action.action));
              if (action.action === "ship") {
                setStatus("kargoda");
              }
              if (action.action === "cancel") {
                setReason((prev) => prev || "Müşteri talebi / stok sorunu");
              }
            }}
          >
            {action.label}
          </button>
        )) : null}
        <button className="btn btn-primary" type="submit">
          Siparişi Güncelle
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDownloadReceipt}>
          Makbuz Aç
        </button>
      </div>
    </form>
  );
}
