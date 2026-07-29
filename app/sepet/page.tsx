"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { LegalDocumentTrigger } from "@/components/legal-document-trigger";
import { useStore } from "@/components/store-provider";
import { formatTry } from "@/lib/money";
import { resolveUnitPrice } from "@/lib/pricing";

export default function CartPage() {
  const router = useRouter();
  const { cart, user, updateQuantity, removeFromCart, clearCart, products } =
    useStore();

  const lines = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((x) => x.id === item.productId);
        if (!product) {
          return null;
        }

        const unitPrice = resolveUnitPrice({
          product,
          role: user?.role || "perakende",
          qty: item.quantity,
        }).unitPrice;
        return {
          ...item,
          name: product.name,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
        };
      })
      .filter((item): item is { productId: string; quantity: number; name: string; unitPrice: number; lineTotal: number } => Boolean(item));
  }, [cart, products, user?.role]);

  const total = useMemo(
    () => lines.reduce((sum, item) => sum + item.lineTotal, 0),
    [lines],
  );

  return (
    <section className="page-shell">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_320px] md:px-8">
        <div className="panel space-y-4">
          <p className="hero-kicker">Akıllı Sepet</p>
          <h1 className="section-title">Sepetim</h1>

          {!lines.length ? (
            <p className="section-sub">
              Sepetiniz boş. <Link href="/urunler">Ürünlere dön</Link>
            </p>
          ) : null}

          {lines.map((item) => (
            <article key={item.productId} className="cart-row">
              <div>
                <h3>{item.name}</h3>
                <p className="text-sm text-slate-500">Birim fiyat: {formatTry(item.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  +
                </button>
                <button
                  className="menu-chip"
                  onClick={() => removeFromCart(item.productId)}
                >
                  Sil
                </button>
              </div>
            </article>
          ))}

        </div>

        <aside className="panel space-y-4">
          <h2 className="text-xl font-semibold">Siparis Ozeti</h2>
              <p className="section-sub">Toplam ürün: {lines.reduce((a, b) => a + b.quantity, 0)}</p>
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-2xl font-extrabold text-slate-800">{formatTry(total)}</p>
          <p className="text-xs text-slate-600">
              Ödemeyi tamamlayarak <LegalDocumentTrigger label="On Bilgilendirme Formu" slug="on-bilgilendirme-formu" className="font-semibold text-slate-700 underline" /> ve <LegalDocumentTrigger label="Mesafeli Satış Sözleşmesi" slug="mesafeli-satis-sozlesmesi" className="font-semibold text-slate-700 underline" /> metinlerini kabul etmiş olursun.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!user) {
                router.push("/hesap/giris?next=%2Fodeme");
              } else {
                router.push("/odeme");
              }
            }}
          >
            Odemeyi Tamamla
          </button>
          <button className="btn btn-secondary" onClick={clearCart}>
            Sepeti Bosalt
          </button>
          {!user ? (
            <p className="text-sm text-amber-700">
              Ödeme için önce <Link href="/hesap/giris?next=%2Fsepet">hesabına giriş yapmalısın</Link>.
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
