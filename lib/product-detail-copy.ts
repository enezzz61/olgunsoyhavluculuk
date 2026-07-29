type ProductDetailHighlightSource = {
  name: string;
  category: string;
  wholesaleEnabled?: boolean;
  wholesaleTiers?: Array<{ minQty: number }>;
  stockStatus?: string;
};

export function getProductDetailHighlights(product: ProductDetailHighlightSource) {
  const name = product.name.toLocaleLowerCase("tr-TR");
  const category = product.category.toLocaleLowerCase("tr-TR");

  const highlights: string[] = [];

  if (category.includes("banyo") || name.includes("banyo")) {
    highlights.push("Yüksek emicilik ve rahat dokusu sayesinde banyo kullanımında konforu artırır.");
    highlights.push("Temiz ve premium görünümüyle ev ve otel dekorasyonlarında öne çıkar.");
  } else if (category.includes("plaj") || name.includes("plaj")) {
    highlights.push("Geniş yüzey alanı ile sahil kullanımında rahat bir deneyim sunar.");
    highlights.push("Yaz sezonu ve açık hava kullanımına uygun hafif ve pratik bir yapı sunar.");
  } else if (category.includes("mutfak") || name.includes("mutfak")) {
    highlights.push("Sıvı emme kapasitesi ve dayanıklı dokusu ile günlük mutfak kullanımına uygundur.");
    highlights.push("Temizliği kolay yapısı sayesinde uzun süreli kullanıma rahatlık sağlar.");
  } else if (category.includes("bebek") || name.includes("bebek")) {
    highlights.push("Nazik ve yumuşak dokusu ile bebek bakım rutinlerinde rahat kullanım sunar.");
    highlights.push("Hassas kullanım için düşünülmüş bir form ve his ile öne çıkar.");
  } else if (category.includes("el") || name.includes("el")) {
    highlights.push("Hızlı kuruma ve pratik kullanım avantajı ile günlük hayatı kolaylaştırır.");
    highlights.push("Küçük boyutuyla banyo, mutfak ve ofis alanlarında kolayca tercih edilir.");
  } else if (category.includes("set") || name.includes("set")) {
    highlights.push("Birden fazla parçadan oluşan set yapısı ile tamamlayıcı kullanım sunar.");
    highlights.push("Doku ve görünüm açısından bütünleşik bir kullanım deneyimi sağlar.");
  } else {
    highlights.push("Yüksek kullanım performansı ve estetik görünümü birlikte sunar.");
    highlights.push("Kullanım alanına uygun tasarımıyla farklı ihtiyaçlara cevap verir.");
  }

  if (product.wholesaleEnabled) {
    const tierText = product.wholesaleTiers && product.wholesaleTiers.length > 0
      ? "kademeli toptan fiyat avantajı"
      : "kolay toptan fiyatlandırma";
    highlights.push(`Kurumsal siparişlerde ${tierText} ile maliyet kontrolü sağlar.`);
  }

  if (product.stockStatus && product.stockStatus !== "tukendi") {
    highlights.push("Stokta bulunan ürünler için hızlı hazırlık ve teslimat süreci desteklenir.");
  }

  return highlights;
}

export function getProductDetailSummary(product: ProductDetailHighlightSource) {
  const category = product.category.toLocaleLowerCase("tr-TR");
  const name = product.name.toLocaleLowerCase("tr-TR");

  if (category.includes("banyo") || name.includes("banyo")) {
    return "Banyo alanında kullanım konforu, estetik görünüm ve uzun ömürlü dokuma kalitesiyle tercih edilir.";
  }

  if (category.includes("plaj") || name.includes("plaj")) {
    return "Plaj ve açık hava kullanımında rahatlık, hafiflik ve pratik taşınabilirlik sunar.";
  }

  if (category.includes("mutfak") || name.includes("mutfak")) {
    return "Mutfak alanında pratik kullanım ve kolay bakım sağlayan bir çözüm sunar.";
  }

  if (category.includes("bebek") || name.includes("bebek")) {
    return "Bebek bakım rutinlerinde yumuşak dokusu ve rahat kullanım hissiyle öne çıkar.";
  }

  if (category.includes("set") || name.includes("set")) {
    return "Tamamlayıcı set yapısı ile birden fazla kullanım alanına rahatça hitap eder.";
  }

  return "İhtiyaca uygun tasarımı, kullanıcı konforu ve kalite beklentisini bir arada karşılar.";
}
