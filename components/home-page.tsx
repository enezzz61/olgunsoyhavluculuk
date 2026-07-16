"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/components/store-provider";
import { formatTry } from "@/lib/money";
import { getStockCountLabel, getStockStatusClass, getStockStatusLabel } from "@/lib/stock";

export function HomePage() {
  const { products, user } = useStore();
  const role = user?.role ?? "perakende";
  const [wholesaleCustomerCount, setWholesaleCustomerCount] = useState<number | null>(null);
  const [retailCustomerCount, setRetailCustomerCount] = useState<number | null>(null);
  const spotlight = products.slice(0, 6);
  const slides = useMemo(
    () =>
      products.slice(0, 4).map((item, index) => ({
        id: item.id,
        title: item.name,
        subtitle: `${item.category} koleksiyonunda yeni sezon secimi`,
        image: item.image,
        href: `/urunler/${item.id}`,
        badge: index === 0 ? "Mega Firsat" : index === 1 ? "Cok Satan" : "Sezona Ozel",
      })),
    [products],
  );
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!slides.length) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3800);

    return () => {
      window.clearInterval(timer);
    };
  }, [slides]);

  useEffect(() => {
    let active = true;

    fetch("/api/public/metrics", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          wholesaleCustomers?: number;
          retailCustomers?: number;
        };
        if (active && Number.isFinite(data.wholesaleCustomers)) {
          setWholesaleCustomerCount(Number(data.wholesaleCustomers));
        }

        if (active && Number.isFinite(data.retailCustomers)) {
          setRetailCustomerCount(Number(data.retailCustomers));
        }
      })
      .catch(() => {
        if (active) {
          setWholesaleCustomerCount(null);
          setRetailCustomerCount(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const metrics = [
    { label: "Aktif Urun", value: `${products.length}+` },
    { label: "Toptanci Musteri", value: wholesaleCustomerCount === null ? "-" : String(wholesaleCustomerCount) },
    { label: "Perakende Musteri", value: retailCustomerCount === null ? "-" : String(retailCustomerCount) },
  ];

  const categories = Array.from(new Set(products.map((item) => item.category))).slice(0, 8);

  return (
    <section className="home-shell">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
        <div className="home-news-ticker" aria-label="Kampanya duyurulari">
          <div className="home-news-track">
            <span>1000 TL VE UZERI SIPARISLERDE KARGO UCRETSIZ</span>
            <span>YENI KAMPANYA VE FIRSATLAR BU ALANDA YAYINLANACAK</span>
            <span>ANLIK DUYURULAR ICIN BU BANDI TAKIP ET</span>
            <span>1000 TL VE UZERI SIPARISLERDE KARGO UCRETSIZ</span>
            <span>YENI KAMPANYA VE FIRSATLAR BU ALANDA YAYINLANACAK</span>
            <span>ANLIK DUYURULAR ICIN BU BANDI TAKIP ET</span>
          </div>
        </div>

        <div className="home-top-menu">
          <div className="home-chip-row">
            <Link href="/urunler" className="menu-chip">Tum Urunler</Link>
            {categories.map((category) => (
              <Link key={category} href="/urunler" className="menu-chip">
                {category}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
          <article className="home-slider">
            {slides.length ? (
              <>
                <Image
                  src={slides[activeSlide].image}
                  alt={slides[activeSlide].title}
                  fill
                  className="home-slider-image"
                  priority
                  sizes="(max-width: 1024px) 100vw, 75vw"
                />
                <div className="home-slider-overlay" />
                <div className="home-slider-content">
                  <p className="hero-kicker">{slides[activeSlide].badge}</p>
                  <h1 className="hero-title">{slides[activeSlide].title}</h1>
                  <p className="hero-desc">{slides[activeSlide].subtitle}</p>
                  <div className="flex gap-2">
                    <Link href={slides[activeSlide].href} className="btn btn-primary">
                      Detaya Git
                    </Link>
                    <Link href="/urunler" className="btn btn-secondary">
                      Katalogu Ac
                    </Link>
                  </div>
                </div>
                <div className="home-slider-dots">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      className={`home-dot ${index === activeSlide ? "home-dot-active" : ""}`}
                      onClick={() => setActiveSlide(index)}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="home-slider-content">
                <p className="hero-kicker">Olgunsoy Havluculuk</p>
                <h1 className="hero-title">Stok yukleniyor...</h1>
              </div>
            )}
          </article>

          <div className="feature-stack">
            <article className="feature-card bg-[#fff4e7]">
              <h3>Hizli Alisveris</h3>
              <p>Anasayfadan sepete tek tikla ekle, odemeyi hizli tamamla.</p>
            </article>
            <article className="feature-card bg-[#eaf7ff]">
              <h3>Bulten Kampanya</h3>
              <p>Mail bultenine katil, yeni sezon fiyatlarini kacirma.</p>
            </article>
            <article className="feature-card bg-[#eef8ed]">
              <h3>Kargo Takibi</h3>
              <p>Siparis kodunla tum sureci anlik izleyebilirsin.</p>
            </article>
          </div>
        </div>

        <div className="home-campaign-row">
          <article className="home-campaign-card">
            <p className="home-campaign-title">Toptan Alima Ozel</p>
            <p>20+ adet siparislerde kademeli fiyat avantaji.</p>
            <Link href="/hesap/kayit" className="menu-chip mt-3 inline-flex">Toptanci Hesabi Ac</Link>
          </article>
          <article className="home-campaign-card">
            <p className="home-campaign-title">Yeni Musteri Firsati</p>
            <p>Kayit olanlara ilk sipariste kampanya bilgilendirmesi.</p>
            <Link href="/hesap/kayit" className="menu-chip mt-3 inline-flex">Uye Ol</Link>
          </article>
          <article className="home-campaign-card">
            <p className="home-campaign-title">Koleksiyon Vitrini</p>
            <p>Sezon trendlerini one cikan urunlerle hemen kesfet.</p>
            <Link href="/urunler" className="menu-chip mt-3 inline-flex">Vitrine Git</Link>
          </article>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spotlight.map((item) => (
            <article key={item.id} className="product-card">
              <Link href={`/urunler/${item.id}`}>
                <Image
                  src={item.image}
                  alt={item.name}
                  className="product-image"
                  width={600}
                  height={600}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                />
              </Link>
              <p className="product-category">{item.category}</p>
              <p className="text-xs text-slate-600">
                Stok: <span className={getStockStatusClass(item.stockStatus)}>{getStockStatusLabel(item.stockStatus)}</span>
              </p>
              <p className="text-xs text-slate-500">Adet: {getStockCountLabel(item.stockCount)}</p>
              <Link href={`/urunler/${item.id}`}>
                <h3>{item.name}</h3>
              </Link>
              <p className="product-text">{item.description}</p>
              <div className="price-row">
                {role === "toptanci" ? (
                  item.wholesaleEnabled && item.wholesaleTiers?.length ? (
                    <span>
                      Toptanci: {item.wholesaleTiers[0].minQty}+ {formatTry(item.wholesaleTiers[0].unitPrice)}
                    </span>
                  ) : (
                    <span>Toptanci: Bu urunde yok</span>
                  )
                ) : (
                  <span>Perakende: {formatTry(item.retailPrice)}</span>
                )}
              </div>
              <Link href={`/urunler/${item.id}`} className="btn btn-secondary mt-2">
                Detaya Git
              </Link>
            </article>
          ))}
        </div>

        <article className="panel home-metrics">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="hero-kicker">B2B + B2C Tek Ekranda</p>
              <h2 className="text-2xl font-extrabold text-slate-800 md:text-3xl">
                Olgunsoy ile siparis, odeme ve kargo tek akista.
              </h2>
              <p className="section-sub mt-2">
                Uretim gucu + dijital operasyon hiziyla, havlu tedarik surecini sade ve hizli hale getiriyoruz.
              </p>
            </div>
            <Link href="/kargo-takip" className="btn btn-primary">
              Kargo Takibe Git
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {metrics.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="text-2xl font-extrabold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
