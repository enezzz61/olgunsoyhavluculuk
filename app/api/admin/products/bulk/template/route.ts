import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/session";
import { apiError, getRequestContext } from "@/lib/api-observability";

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/admin/products/bulk/template");
  if (!(await requireAdmin())) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  const worksheet = XLSX.utils.aoa_to_sheet([
    [
      "sku",
      "name",
      "category",
      "image",
      "gallery",
      "retailPrice",
      "stockCount",
      "stockStatus",
      "wholesaleEnabled",
      "description",
      "active",
      "wholesaleTiers",
    ],
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="olgunsoy-urun-sablonu.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
