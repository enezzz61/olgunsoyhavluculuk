export type OrderStatus =
  | "odeme_alindi"
  | "hazirlaniyor"
  | "kargoda"
  | "teslim_edildi"
  | "iptal";

export const orderStatusLabel: Record<OrderStatus, string> = {
  odeme_alindi: "Odeme Alindi",
  hazirlaniyor: "Hazirlaniyor",
  kargoda: "Kargoda",
  teslim_edildi: "Teslim Edildi",
  iptal: "Iptal",
};

export function orderStatusClass(status: OrderStatus) {
  if (status === "teslim_edildi") {
    return "status-chip status-delivered";
  }
  if (status === "kargoda") {
    return "status-chip status-shipping";
  }
  if (status === "iptal") {
    return "status-chip status-cancelled";
  }
  if (status === "hazirlaniyor") {
    return "status-chip status-preparing";
  }
  return "status-chip status-paid";
}
