import type { OrderStatus } from "./order-status";

export type OrderWorkflowAction = "approve" | "prepare" | "ship" | "deliver" | "cancel";

export type OrderWorkflowStep = {
  action: OrderWorkflowAction;
  label: string;
  nextStatus: OrderStatus;
  requiresTrackingCode?: boolean;
  requiresReason?: boolean;
};

export function getOrderWorkflowActions(status: OrderStatus): OrderWorkflowStep[] {
  switch (status) {
    case "odeme_alindi":
      return [
        { action: "approve", label: "Onayla", nextStatus: "hazirlaniyor" },
        { action: "cancel", label: "İptal Et", nextStatus: "iptal", requiresReason: true },
      ];
    case "hazirlaniyor":
      return [
        { action: "ship", label: "Kargoya Ver", nextStatus: "kargoda", requiresTrackingCode: true },
        { action: "cancel", label: "İptal Et", nextStatus: "iptal", requiresReason: true },
      ];
    case "kargoda":
      return [{ action: "deliver", label: "Teslim Edildi", nextStatus: "teslim_edildi" }];
    default:
      return [];
  }
}

export function resolveOrderStatusFromAction(action: OrderWorkflowAction): OrderStatus {
  switch (action) {
    case "approve":
    case "prepare":
      return "hazirlaniyor";
    case "ship":
      return "kargoda";
    case "deliver":
      return "teslim_edildi";
    case "cancel":
      return "iptal";
  }
}

export function buildOrderReceiptHtml(
  order: {
    id: string;
    total: number;
    createdAt?: string;
    user?: { name?: string; email?: string };
    items?: Array<{ name: string; quantity: number; unitPrice: number; lineTotal: number }>;
    shippingAddress?: {
      fullName?: string;
      phone?: string;
      city?: string;
      district?: string;
      address?: string;
      postalCode?: string;
    };
  },
  user?: { name?: string; email?: string },
  logoUrl = "/logo.jpg",
) {
  const customerName = user?.name || order.user?.name || "Müşteri";
  const customerEmail = user?.email || order.user?.email || "-";
  const issuedAt = order.createdAt ? new Date(order.createdAt).toLocaleString("tr-TR") : "-";
  const shippingAddress = order.shippingAddress;
  const itemRows = (order.items || [])
    .map((item) => {
      const unit = item.unitPrice.toLocaleString("tr-TR");
      const total = item.lineTotal.toLocaleString("tr-TR");
      return `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${unit} ₺</td><td>${total} ₺</td></tr>`;
    })
    .join("");

  const addressBlock = shippingAddress
    ? `<div class="section"><h3> Teslimat Bilgileri</h3><p>${shippingAddress.fullName || customerName}</p><p>${shippingAddress.phone || "-"}</p><p>${[shippingAddress.address, shippingAddress.district, shippingAddress.city, shippingAddress.postalCode].filter(Boolean).join(" / ")}</p></div>`
    : "";

  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <title>Sipariş Makbuzu</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111827; padding: 24px; background: #f9fafb; }
      .card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; background: #fff; }
      .header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 16px; }
      .logo { max-width: 140px; max-height: 80px; object-fit: contain; }
      .title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
      .muted { color: #6b7280; }
      .row { display: flex; justify-content: space-between; margin: 8px 0; }
      .section { margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; }
      .total { font-size: 20px; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div>
          <div class="title">Sipariş Makbuzu</div>
          <p class="muted">Olgunsoy Havluculuk</p>
        </div>
        <img class="logo" src="${logoUrl}" alt="Olgunsoy Havluculuk Logo" />
      </div>
      <div class="row"><span>Sipariş No</span><strong>${order.id}</strong></div>
      <div class="row"><span>Müşteri</span><strong>${customerName}</strong></div>
      <div class="row"><span>E-posta</span><strong>${customerEmail}</strong></div>
      <div class="row"><span>Oluşturulma</span><strong>${issuedAt}</strong></div>
      <div class="section">
        <h3>Ürünler</h3>
        <table>
          <thead><tr><th>Ürün</th><th>Adet</th><th>Birim Fiyat</th><th>Toplam</th></tr></thead>
          <tbody>${itemRows || "<tr><td colspan='4'>Ürün bilgisi yok</td></tr>"}</tbody>
        </table>
      </div>
      ${addressBlock}
      <div class="section">
        <div class="row total"><span>Toplam</span><span>${order.total.toLocaleString("tr-TR")} ₺</span></div>
      </div>
    </div>
  </body>
</html>`;
}
