"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/components/store-provider";
import { formatTry } from "@/lib/money";
import { canUseWholesale, resolveUnitPrice } from "@/lib/pricing";
import { getImageSource } from "@/lib/image-fallback";
import { getStockCountLabel, getStockStatusClass, getStockStatusLabel, isOutOfStock } from "@/lib/stock";

export function ProductsPage() {
  const { user, addToCart, products } = useStore();
  const [category, setCategory] = useState<string>("Tüm");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"onerilen" | "fiyat_artan" | "fiyat_azalan" | "ad_az" | "ad_za">("onerilen");
  const [page, setPage] = useState(1);
  const [info, setInfo] = useState("");
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const pageSize = 9;
  const role = user?.role ?? "perakende";

  const categories = useMemo(
    () => ["Tüm", ...Array.from(new Set(products.map((item) => item.category)))],
    [products],
  );

  const visible = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("tr-TR");
    const filtered = products.filter((item) => {
      const byCategory = category === "Tüm" ? true : item.category === category;
      const bySearch =
        !normalizedQuery ||
        item.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        item.category.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        item.description.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        item.sku.toLocaleLowerCase("tr-TR").includes(normalizedQuery);

      return byCategory && bySearch;
    });

    const sorted = [...filtered];
    if (sortBy === "ad_az") {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    } else if (sortBy === "ad_za") {
      sorted.sort((a, b) => b.name.localeCompare(a.name, "tr"));
    } else if (sortBy === "fiyat_artan") {
      sorted.sort(
        (a, b) =>
          resolveUnitPrice({ product: a, role, qty: 1 }).unitPrice -
          resolveUnitPrice({ product: b, role, qty: 1 }).unitPrice,
      );
    } else if (sortBy === "fiyat_azalan") {
      sorted.sort(
        (a, b) =>
          resolveUnitPrice({ product: b, role, qty: 1 }).unitPrice -
          resolveUnitPrice({ product: a, role, qty: 1 }).unitPrice,
      );
    }

    return sorted;
  }, [category, products, role, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return visible.slice(start, start + pageSize);
  }, [safePage, visible]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <section className="page-shell">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 md:px-8">
        <div className="panel">
          <p className="hero-kicker">Olgunsoy Koleksiyon</p>
          <h1 className="section-title">Havlu Kataloğu</h1>
          <p className="section-sub">
            Fiyatlar aktif role göre gösterilir. Giriş yaptığında toptancı veya perakende
            modu otomatik uygulanır.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                className={`menu-chip ${item === category ? "menu-chip-active" : ""}`}
                onClick={() => {
                  setCategory(item);
                  setPage(1);
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Urun, kategori, aciklama veya SKU ara"
              className="input w-full min-w-0"
              aria-label="Urun arama"
            />

            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as "onerilen" | "fiyat_artan" | "fiyat_azalan" | "ad_az" | "ad_za");
                setPage(1);
              }}
              className="input w-full min-w-0"
              aria-label="Siralama secimi"
            >
              <option value="onerilen">Onerilen</option>
              <option value="fiyat_artan">Fiyat Artan</option>
              <option value="fiyat_azalan">Fiyat Azalan</option>
              <option value="ad_az">Isim A-Z</option>
              <option value="ad_za">Isim Z-A</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <p>
              Sonuc: <strong>{visible.length}</strong> urun
            </p>
            <button
              className="menu-chip"
              onClick={() => {
                setCategory("Tum");
                setSearchQuery("");
                setSortBy("onerilen");
                setPage(1);
              }}
            >
              Filtreleri Sıfırla
            </button>
          </div>
          {info ? <p className="mt-3 text-sm text-emerald-700">{info}</p> : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pagedProducts.map((item) => (
            <article key={item.id} className="product-card">
              <Link href={`/urunler/${item.id}`}>
                <Image
                  src={imageMap[item.id] ?? getImageSource(item.image)}
                  alt={item.name}
                  className="product-image"
                  width={600}
                  height={600}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                  unoptimized
                  onError={() => {
                    setImageMap((prev) => ({ ...prev, [item.id]: getImageSource(item.image, undefined, true) }));
                  }}
                />
              </Link>
              <p className="product-category">{item.category}</p>
              <Link href={`/urunler/${item.id}`}>
                <h3>{item.name}</h3>
              </Link>
              <p className="product-text">{item.description}</p>
              <p className="text-sm text-slate-700">
                Stok: <span className={getStockStatusClass(item.stockStatus)}>{getStockStatusLabel(item.stockStatus)}</span>
              </p>
              <p className="text-xs text-slate-500">Adet: {getStockCountLabel(item.stockCount)}</p>
              <p className="text-sm text-slate-700">
                Aktif fiyat ({role}): <strong>{formatTry(resolveUnitPrice({ product: item, role, qty: 1 }).unitPrice)}</strong>
              </p>
              {role === "toptanci" && canUseWholesale(item) ? (
                <div className="text-xs text-slate-500">
                  {item.wholesaleTiers?.map((tier) => (
                    <p key={`${item.id}-${tier.minQty}`}>
                      {tier.minQty}+ adet: {formatTry(tier.unitPrice)}
                    </p>
                  ))}
                </div>
              ) : role === "toptanci" ? (
                <p className="text-xs text-amber-700">Bu üründe toptan fiyat yok.</p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <button
                  className="btn btn-primary"
                  disabled={isOutOfStock(item.stockCount)}
                  onClick={() => {
                    if (isOutOfStock(item.stockCount)) {
                      setInfo(`${item.name} tükendi.`);
                      return;
                    }

                    addToCart(item.id, 1);
                    setInfo(`${item.name} sepete eklendi.`);
                  }}
                >
                  {isOutOfStock(item.stockCount) ? "Tükendi" : "Sepete Ekle"}
                </button>
                <Link href={`/urunler/${item.id}`} className="btn btn-secondary">
                  Incele
                </Link>
              </div>
            </article>
          ))}
        </div>

        {visible.length > pageSize ? (
          <div className="panel flex flex-wrap items-center justify-between gap-3">
            <p className="section-sub">
              Sayfa {safePage}/{totalPages} - Toplam {visible.length} ürün
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="menu-chip"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
              >
                Onceki
              </button>
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  className={`menu-chip ${number === safePage ? "menu-chip-active" : ""}`}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}
              <button
                className="menu-chip"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
              >
                Sonraki
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
