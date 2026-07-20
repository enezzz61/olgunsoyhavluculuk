import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { canUseMockData, getMockProductById, isDbUnavailableError } from "@/lib/db-fallback";
import { formatTry } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, truncateText } from "@/lib/seo";
import { getSessionUser } from "@/lib/session";
import { getStockCountLabel, getStockStatusClass, getStockStatusLabel } from "@/lib/stock";

type ProductWithTiers = {
  id: string;
  sku: string;
  name: string;
  category: string;
  image: string;
  gallery: string;
  retailPrice: number;
  stockStatus?: string;
  stockCount?: number;
  wholesaleEnabled: boolean;
  description: string;
  active: boolean;
  wholesaleTiers: Array<{
    id: string;
    minQty: number;
    unitPrice: number;
  }>;
};

function toProductWithTiersFromMock(id: string): ProductWithTiers | null {
  const mock = getMockProductById(id);
  if (!mock) {
    return null;
  }

  return {
    id: mock.id,
    sku: mock.sku,
    name: mock.name,
    category: mock.category,
    image: mock.image,
    gallery: JSON.stringify(Array.isArray(mock.gallery) ? mock.gallery : [mock.image]),
    retailPrice: mock.retailPrice,
    stockStatus: mock.stockStatus,
    stockCount: mock.stockCount,
    wholesaleEnabled: mock.wholesaleEnabled,
    description: mock.description,
    active: mock.active !== false,
    wholesaleTiers: (mock.wholesaleTiers || []).map((tier) => ({
      id: tier.id,
      minQty: tier.minQty,
      unitPrice: tier.unitPrice,
    })),
  };
}

async function resolveProductById(id: string): Promise<ProductWithTiers | null> {
  // Check if it's a mock ID
  if (id.startsWith("mock-")) {
    return toProductWithTiersFromMock(id);
  }

  try {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        wholesaleTiers: {
          orderBy: { minQty: "asc" },
        },
      },
    });
  } catch (error) {
    if (isDbUnavailableError(error) && canUseMockData()) {
      return toProductWithTiersFromMock(id);
    }

    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const product = await resolveProductById(id);

  if (!product || !product.active) {
    return {
      title: "Ürün Bulunamadı",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = `/urunler/${product.id}`;
  const description = truncateText(product.description || `${product.name} urun detayi`, 160);

  return {
    title: product.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: product.name,
      description,
      url: canonical,
      type: "website",
      images: [
        {
          url: absoluteUrl(product.image),
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [absoluteUrl(product.image)],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await resolveProductById(id);
  const sessionUser = await getSessionUser();
  const role = sessionUser?.role === "toptanci" ? "toptanci" : "perakende";

  if (!product || !product.active) {
    notFound();
  }

  let gallery: string[] = [product.image];
  try {
    const parsed = JSON.parse(product.gallery || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      gallery = parsed.map((item) => String(item));
    }
  } catch {
    gallery = [product.image];
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: gallery.map((item) => absoluteUrl(item)),
    description: truncateText(product.description || product.name, 300),
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "Olgunsoy Havluculuk",
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/urunler/${product.id}`),
      availability: "https://schema.org/InStock",
      priceCurrency: "TRY",
      price: product.retailPrice,
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <section className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 md:px-8">
        <div className="panel">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/urunler">Urunler</Link>
            <span>/</span>
            <span className="text-slate-700">{product.name}</span>
          </div>
        </div>

        <div className="detail-grid">
          <article className="panel detail-image-wrap">
            <ProductImageGallery images={gallery} alt={product.name} />
          </article>

          <article className="panel space-y-4">
            <p className="product-category">{product.category}</p>
            <h1 className="section-title">{product.name}</h1>
            <p className="section-sub">{product.description}</p>

            <div className="detail-price-grid">
              <div className="detail-price-card">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {role === "toptanci" ? "Toptanci" : "Perakende"}
                </p>
                {role === "toptanci" ? (
                  product.wholesaleEnabled && product.wholesaleTiers.length ? (
                    <p className="text-2xl font-extrabold text-slate-800">{formatTry(product.wholesaleTiers[0].unitPrice)}</p>
                  ) : (
                    <p className="text-base font-semibold text-amber-700">Bu urunde toptan fiyat yok</p>
                  )
                ) : (
                  <p className="text-2xl font-extrabold text-slate-800">{formatTry(product.retailPrice)}</p>
                )}
              </div>
            </div>

            {role === "toptanci" && product.wholesaleEnabled && product.wholesaleTiers.length ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-700">Toptan Fiyat Kademeleri</p>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  {product.wholesaleTiers.map((tier) => (
                    <p key={tier.id}>
                      {tier.minQty}+ adet: {formatTry(tier.unitPrice)}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p>SKU: {product.sku}</p>
              <p>
                Stok Durumu: <span className={getStockStatusClass(product.stockStatus)}>{getStockStatusLabel(product.stockStatus)}</span>
              </p>
              <p>Stok Adedi: {getStockCountLabel(product.stockCount)}</p>
              <p>Toptan satis: {product.wholesaleEnabled ? "Acik" : "Yok"}</p>
            </div>

            <ProductDetailActions
              productId={product.id}
              productName={product.name}
              minWholesaleQty={product.wholesaleTiers[0]?.minQty || 0}
              stockCount={product.stockCount}
            />

            <div className="detail-benefits">
              <p className="detail-benefit-title">Bu urunde neler var?</p>
              <ul>
                <li>Yuksek emicilik ve uzun omurlu dokuma</li>
                <li>Musteri tipine gore otomatik fiyat gosterimi</li>
                <li>Siparis sonrasi kargo takip kodu ile anlik durum izleme</li>
              </ul>
            </div>
          </article>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="panel">
            <p className="hero-kicker">Kampanya</p>
            <h3 className="text-lg font-bold">Toptan Siparis Avantaji</h3>
            <p className="section-sub mt-2">Kademeli adet fiyatlari ile kurumsal alimlarda maliyet kontrolu.</p>
          </article>
          <article className="panel">
            <p className="hero-kicker">Teslimat</p>
            <h3 className="text-lg font-bold">Hizli Kargolama</h3>
            <p className="section-sub mt-2">Hazir stok urunlerde ayni gun cikis hedeflenir.</p>
          </article>
          <article className="panel">
            <p className="hero-kicker">Destek</p>
            <h3 className="text-lg font-bold">Kurumsal Teklif</h3>
            <p className="section-sub mt-2">Otel, spa ve toplu alim projeleri icin ozel fiyatlandirma.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
