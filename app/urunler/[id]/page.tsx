import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { ProductVariantPalette } from "@/components/product-variant-palette";
import { ProductVariantProvider, type GalleryImageItem } from "@/components/product-variant-context";
import { canUseMockData, getMockProductById, isDbUnavailableError } from "@/lib/db-fallback";
import { getImageSource } from "@/lib/image-fallback";
import { formatTry } from "@/lib/money";
import { getProductDetailHighlights, getProductDetailSummary } from "@/lib/product-detail-copy";
import { prisma } from "@/lib/prisma";
import { isDatabaseObjectId, isMockProductId, shouldQueryProductCatalog } from "@/lib/product-related";
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

function splitVariantEntry(raw: string) {
  const delimiters = ["|", "::", "->", " - ", " : "];

  for (const delimiter of delimiters) {
    const index = raw.indexOf(delimiter);
    if (index <= 0) {
      continue;
    }

    const left = raw.slice(0, index).trim();
    const right = raw.slice(index + delimiter.length).trim();
    if (!left || !right) {
      continue;
    }

    return {
      label: left,
      src: right,
    };
  }

  return null;
}

function extractUrlFromVariantText(raw: string) {
  const urlPattern = /(https?:\/\/\S+|\/api\/uploads\/\S+|\/uploads\/\S+|uploads\/\S+)/i;
  const match = raw.match(urlPattern);
  if (!match || match.index === undefined) {
    return null;
  }

  const src = match[1].trim();
  const labelRaw = raw.slice(0, match.index).trim().replace(/[|:\-]+$/g, "").trim();

  return {
    label: labelRaw,
    src,
  };
}

function parseGalleryItem(value: string): GalleryImageItem {
  const raw = String(value || "").trim();
  if (!raw) {
    return { src: "" };
  }

  const split = splitVariantEntry(raw);
  if (!split) {
    const extracted = extractUrlFromVariantText(raw);
    if (extracted?.src) {
      return {
        src: getImageSource(extracted.src),
        label: extracted.label || undefined,
      };
    }

    return { src: getImageSource(raw) };
  }

  return {
    src: getImageSource(split.src),
    label: split.label || undefined,
  };
}

function parseProductGallery(image: string, galleryRaw: string): GalleryImageItem[] {
  let rawItems: string[] = [image];
  try {
    const parsed = JSON.parse(galleryRaw || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      rawItems = parsed.map((item) => String(item));
    }
  } catch {
    rawItems = [image];
  }

  const parsedItems = rawItems.map((item) => parseGalleryItem(item)).filter((item) => item.src);
  if (!parsedItems.length) {
    return [{ src: getImageSource(image) }];
  }

  const unique = new Map<string, GalleryImageItem>();
  for (const item of parsedItems) {
    if (!unique.has(item.src)) {
      unique.set(item.src, item);
    }
  }

  return Array.from(unique.values());
}

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

function normalizeDetailTokens(text: string) {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9ğüşıöç\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function getRelatedProductScore(currentProduct: ProductWithTiers, candidateProduct: ProductWithTiers) {
  const currentCategoryTokens = normalizeDetailTokens(currentProduct.category);
  const candidateCategoryTokens = normalizeDetailTokens(candidateProduct.category);
  const currentTokens = new Set([
    ...normalizeDetailTokens(currentProduct.name),
    ...currentCategoryTokens,
    ...normalizeDetailTokens(currentProduct.description),
  ]);
  const candidateTokens = new Set([
    ...normalizeDetailTokens(candidateProduct.name),
    ...candidateCategoryTokens,
    ...normalizeDetailTokens(candidateProduct.description),
  ]);

  const sharedTokens = Array.from(currentTokens).filter((token) => candidateTokens.has(token));
  const overlapRatio = sharedTokens.length / Math.max(1, Math.max(currentTokens.size, candidateTokens.size));

  let score = overlapRatio * 0.6;

  if (currentProduct.category.toLocaleLowerCase("tr-TR") === candidateProduct.category.toLocaleLowerCase("tr-TR")) {
    score += 0.8;
  } else {
    const sharedCategoryTerms = currentCategoryTokens.filter((token) => candidateCategoryTokens.includes(token));
    if (sharedCategoryTerms.length) {
      score += 0.3;
    }
  }

  const sharedNameTokens = normalizeDetailTokens(currentProduct.name).filter((token) =>
    normalizeDetailTokens(candidateProduct.name).includes(token),
  );
  if (sharedNameTokens.length) {
    score += 0.2;
  }

  return score;
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
          url: absoluteUrl(getImageSource(product.image)),
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [absoluteUrl(getImageSource(product.image))],
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

  const gallery = parseProductGallery(product.image, product.gallery);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: gallery.map((item) => absoluteUrl(item.src)),
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

  const detailHighlights = getProductDetailHighlights({
    name: product.name,
    category: product.category,
    wholesaleEnabled: product.wholesaleEnabled,
    wholesaleTiers: product.wholesaleTiers,
    stockStatus: product.stockStatus,
  });
  const detailSummary = getProductDetailSummary({
    name: product.name,
    category: product.category,
    wholesaleEnabled: product.wholesaleEnabled,
    wholesaleTiers: product.wholesaleTiers,
    stockStatus: product.stockStatus,
  });

  let catalogProducts: ProductWithTiers[] = [];

  if (shouldQueryProductCatalog(product.id)) {
    catalogProducts = await prisma.product.findMany({
      where: {
        active: true,
        id: { not: product.id },
      },
      include: {
        wholesaleTiers: {
          orderBy: { minQty: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  const scoredRelatedProducts = [...catalogProducts]
    .map((item) => ({
      item,
      score: getRelatedProductScore(product, item),
    }))
    .sort((left, right) => right.score - left.score);

  const relatedProducts = scoredRelatedProducts
    .filter(({ score }) => score >= 0.2)
    .slice(0, 4)
    .map(({ item }) => item);

  const fallbackProducts = scoredRelatedProducts
    .filter(({ item }) => !relatedProducts.some((related) => related.id === item.id))
    .slice(0, Math.max(0, 4 - relatedProducts.length))
    .map(({ item }) => item);

  const visibleRelatedProducts = [...relatedProducts, ...fallbackProducts].slice(0, 4);

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

        <ProductVariantProvider images={gallery}>
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {role === "toptanci" ? "Toptanci" : "Perakende"} fiyatı
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
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Hızlı teslimat
                  </div>
                </div>
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
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  SKU: {product.sku}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  Stok: <span className={getStockStatusClass(product.stockStatus)}>{getStockStatusLabel(product.stockStatus)}</span>
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  {product.wholesaleEnabled ? "Toptan satış açık" : "Toptan satış yok"}
                </span>
              </div>
              <ProductVariantPalette />
              <p className="mt-3">Stok adedi: {getStockCountLabel(product.stockCount)}</p>
            </div>

            <ProductDetailActions
              productId={product.id}
              productName={product.name}
              minWholesaleQty={product.wholesaleTiers[0]?.minQty || 0}
              stockCount={product.stockCount}
            />

            <div className="detail-benefits">
              <p className="detail-benefit-title">Neden bu ürünü seçmelisiniz?</p>
              <p className="mb-2 text-sm text-slate-700">{detailSummary}</p>
              <ul>
                {detailHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[#8be3d5] bg-[#f8fffe] p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-800">Ürünü tercih edenler için</p>
              <p className="mt-1">Kaliteli dokuma, güvenli teslimat ve net fiyatlandırma ile alışveriş deneyimini daha keyifli hale getiriyoruz.</p>
            </div>
            </article>
          </div>
        </ProductVariantProvider>

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

        {visibleRelatedProducts.length ? (
          <div className="panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="hero-kicker">Benzer Ürünler</p>
                <h2 className="text-xl font-extrabold text-slate-800">Bu ürüne benzer seçenekler</h2>
              </div>
              <Link href="/urunler" className="text-sm font-semibold text-slate-700">
                Tüm ürünleri gör
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleRelatedProducts.map((item) => {
                const itemPrice = role === "toptanci" && item.wholesaleTiers.length
                  ? item.wholesaleTiers[0].unitPrice
                  : item.retailPrice;

                return (
                  <article key={item.id} className="product-card">
                    <Link href={`/urunler/${item.id}`}>
                      <Image
                        src={getImageSource(item.image)}
                        alt={item.name}
                        className="product-image"
                        width={600}
                        height={600}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        loading="lazy"
                      />
                    </Link>
                    <p className="product-category">{item.category}</p>
                    <Link href={`/urunler/${item.id}`}>
                      <h3>{item.name}</h3>
                    </Link>
                    <p className="product-text">{item.description}</p>
                    <div className="price-row">
                      <span>{role === "toptanci" ? "Toptancı" : "Perakende"}: {formatTry(itemPrice)}</span>
                    </div>
                    <Link href={`/urunler/${item.id}`} className="btn btn-secondary mt-2">
                      Ürüne Git
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
