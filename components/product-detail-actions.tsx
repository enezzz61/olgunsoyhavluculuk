"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/store-provider";
import { getStockCountLabel, isOutOfStock } from "@/lib/stock";

type ProductDetailActionsProps = {
  productId: string;
  productName: string;
  minWholesaleQty: number;
  stockCount?: number;
};

export function ProductDetailActions({
  productId,
  productName,
  minWholesaleQty,
  stockCount,
}: ProductDetailActionsProps) {
  const { addToCart, user } = useStore();
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");
  const unavailable = isOutOfStock(stockCount);
  const maxQty = typeof stockCount === "number" && stockCount > 0 ? stockCount : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          className="qty-btn"
          onClick={() => setQty((prev) => Math.max(1, prev - 1))}
          type="button"
          disabled={unavailable}
        >
          -
        </button>
        <span className="min-w-8 text-center font-semibold">{qty}</span>
        <button
          className="qty-btn"
          onClick={() => setQty((prev) => (maxQty ? Math.min(maxQty, prev + 1) : prev + 1))}
          type="button"
          disabled={unavailable}
        >
          +
        </button>
      </div>

      <button
        className="btn btn-primary w-full"
        type="button"
        disabled={unavailable}
        onClick={() => {
          if (unavailable) {
            setMessage("Bu ürün tükendi.");
            return;
          }

          const nextQty = maxQty ? Math.min(maxQty, qty) : qty;
          addToCart(productId, nextQty);
          setMessage(`${productName} sepete eklendi (${nextQty} adet).`);
        }}
      >
        {unavailable ? "Tükendi" : "Sepete Ekle"}
      </button>

      <Link href="/sepet" className="btn btn-secondary w-full">
        Sepete Git
      </Link>

      {user?.role !== "toptanci" ? (
        <p className="section-sub text-xs">
          Toptancı fiyatını görmek için toptancı hesabıyla giriş yapabilirsin.
          {minWholesaleQty > 0 ? ` Min toptanci adet: ${minWholesaleQty}` : " Bu urunde toptan satis yok."}
        </p>
      ) : null}

      <p className="text-xs text-slate-500">Stok: {getStockCountLabel(stockCount)}</p>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
    </div>
  );
}
