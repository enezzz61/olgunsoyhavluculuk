export type LegalDocumentSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  summary: string;
  updatedAt: string;
  sections: LegalDocumentSection[];
};

export const legalDocuments: LegalDocument[] = [
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydinlatma Metni",
    summary: "6698 sayili KVKK kapsaminda kisisel verilerin hangi amaclarla islendigi ve haklariniz.",
    updatedAt: "08.07.2026",
    sections: [
      {
        heading: "Veri Sorumlusu",
        paragraphs: [
          "Bu aydinlatma metni, veri sorumlusu sifatini haiz Olgunsoy Havluculuk tarafindan 6698 sayili Kisisel Verilerin Korunmasi Kanunu kapsaminda hazirlanmistir.",
          "Iletisim: destek@olgunsoyhavluculuk.com.",
        ],
      },
      {
        heading: "Islenen Veri Kategorileri",
        paragraphs: [
          "Kimlik ve iletisim verileri (ad soyad, e-posta), uyelik ve siparis surecine iliskin islem kayitlari, odeme surecine iliskin teknik kayitlar, cerez ve cihaz verileri islenebilir.",
        ],
      },
      {
        heading: "Isleme Amaclari",
        paragraphs: [
          "Uyelik olusturma, siparis alma, odeme ve teslimat sureclerini yurutme, musteri destek taleplerini karasilama, mevzuattan dogan yukumlulukleri yerine getirme ve hizmet kalitesini gelistirme amaclariyla veri islenir.",
        ],
      },
      {
        heading: "Hukuki Sebepler ve Aktarim",
        paragraphs: [
          "Veriler, sozlesmenin kurulmasi/ifasi, hukuki yukumlulugun yerine getirilmesi ve mesru menfaat hukuki sebeplerine dayanilarak islenir.",
          "Odeme, kargo, barindirma ve teknik altyapi hizmeti aldigimiz is ortaklariyla, gerekli oldugu olcude ve mevzuata uygun sekilde paylasilabilir.",
        ],
      },
      {
        heading: "KVKK Kapsamindaki Haklar",
        paragraphs: [
          "Kanunun 11. maddesi kapsaminda veri islenip islenmedigini ogrenme, duzeltme, silme, aktarmaya itiraz etme ve zarar halinde tazmin talep etme haklarina sahipsiniz.",
          "Hak taleplerinizi destek@olgunsoyhavluculuk.com adresine iletebilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikasi",
    summary: "Sitede toplanan bilgilerin gizliligi, guvenligi ve saklama sureclerine iliskin esaslar.",
    updatedAt: "08.07.2026",
    sections: [
      {
        heading: "Kapsam",
        paragraphs: [
          "Bu politika, web sitesi ve bagli hizmetlerde toplanan kisisel verilerin korunmasina iliskin ilke ve kurallari aciklar.",
        ],
      },
      {
        heading: "Guvenlik",
        paragraphs: [
          "Kisisel verilerinizin guvenligi icin teknik ve idari tedbirler uygulanir. Yetkisiz erisim, degisiklik veya kaybi onlemeye yonelik surekli kontrol mekanizmalari kullanilir.",
        ],
      },
      {
        heading: "Saklama ve Imha",
        paragraphs: [
          "Veriler, ilgili mevzuatta ongorulen veya isleme amacinin gerektirdigi sure boyunca saklanir. Sure sonunda mevzuata uygun sekilde silinir, yok edilir veya anonimlestirilir.",
        ],
      },
      {
        heading: "Ucuncu Taraf Hizmetleri",
        paragraphs: [
          "Odeme altyapisi, kargo, e-posta ve barindirma hizmeti aldigimiz cozum ortaklari kendi gizlilik yukumlulukleri dahilinde veri isleyebilir.",
        ],
      },
    ],
  },
  {
    slug: "cerez-politikasi",
    title: "Cerez Politikasi",
    summary: "Site deneyimini iyilestirmek icin kullanilan cerez turleri ve tercih yonetimi.",
    updatedAt: "08.07.2026",
    sections: [
      {
        heading: "Cerez Nedir?",
        paragraphs: [
          "Cerezler, tarayiciniz araciligiyla cihazinizda saklanan kucuk metin dosyalaridir. Tercihlerinizi hatirlamak ve hizmetleri daha iyi sunmak icin kullanilir.",
        ],
      },
      {
        heading: "Kullandigimiz Cerezler",
        paragraphs: [
          "Zorunlu cerezler oturum ve temel islevler icin gereklidir. Izin vermeniz halinde performans ve pazarlama amacli cerezler de kullanilabilir.",
        ],
      },
      {
        heading: "Tercihlerinizi Yonetme",
        paragraphs: [
          "Tarayici ayarlarinizdan cerezleri silebilir veya engelleyebilirsiniz. Ancak bazi cerezlerin kapatilmasi, sitenin bazi ozelliklerinin dogru calismamasina neden olabilir.",
        ],
      },
    ],
  },
  {
    slug: "on-bilgilendirme-formu",
    title: "On Bilgilendirme Formu",
    summary: "Mesafeli satis oncesinde satin alma, odeme, teslimat ve cayma hakki konusunda temel bilgilendirme.",
    updatedAt: "08.07.2026",
    sections: [
      {
        heading: "Satici Bilgileri",
        paragraphs: [
          "Satici: Olgunsoy Havluculuk",
          "Iletisim: destek@olgunsoyhavluculuk.com",
        ],
      },
      {
        heading: "Urun ve Fiyat",
        paragraphs: [
          "Urunlerin temel nitelikleri ve satis fiyatlari siparis asamasinda sepet ve odeme ekraninda gosterilir. Fiyatlara yasal vergiler dahildir.",
        ],
      },
      {
        heading: "Odeme ve Teslimat",
        paragraphs: [
          "Odeme online odeme altyapisi uzerinden guvenli sekilde alinabilir. Teslimat suresi urun stok durumu ve lojistik kosullara gore siparis aninda belirtilir.",
        ],
      },
      {
        heading: "Cayma Hakki",
        paragraphs: [
          "Tuketici, mesafeli satis mevzuati kapsaminda cayma hakki kosullarindan yararlanabilir. Cayma hakki istisnalari ve iade sureci Iade ve Iptal Politikasi metninde aciklanmistir.",
        ],
      },
    ],
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satis Sozlesmesi",
    summary: "Satici ile alici arasinda elektronik ortamda kurulan satis sozlesmesinin genel kosullari.",
    updatedAt: "08.07.2026",
    sections: [
      {
        heading: "Taraflar ve Konu",
        paragraphs: [
          "Isbu sozlesme, alicinin saticiya ait internet sitesi uzerinden elektronik ortamda siparis verdigi urunun satis ve teslimine iliskin taraflarin hak ve yukumluluklerini duzenler.",
        ],
      },
      {
        heading: "Siparis ve Odeme",
        paragraphs: [
          "Alici, siparis oncesi urun, toplam bedel, odeme yontemi ve teslimat bilgilerini gorerek onaylar. Odeme tamamlandiginda siparis olusturulur.",
        ],
      },
      {
        heading: "Teslimat ve Muayene",
        paragraphs: [
          "Satici, urunu yasal surelerde ve stok durumuna uygun sekilde kargoya teslim eder. Alici, teslim aninda urunu kontrol etmeli ve acik hasar varsa tutanak duzenlemelidir.",
        ],
      },
      {
        heading: "Cayma, Iade ve Uyusmazlik",
        paragraphs: [
          "Cayma hakki, iade ve degisim sureci Iade ve Iptal Politikasi'nda belirtilen kosullara tabidir.",
          "Uyusmazliklarda Tuketici Hakem Heyeti ve Tuketici Mahkemeleri yetkilidir.",
        ],
      },
    ],
  },
  {
    slug: "iade-ve-iptal-politikasi",
    title: "Iade ve Iptal Politikasi",
    summary: "Siparis iptali, iade sureci, cayma hakki ve bedel iadesine iliskin kosullar.",
    updatedAt: "08.07.2026",
    sections: [
      {
        heading: "Siparis Iptali",
        paragraphs: [
          "Kargoya verilmemis siparisler, destek birimi ile iletisime gecilerek iptal edilebilir.",
        ],
      },
      {
        heading: "Iade Sureci",
        paragraphs: [
          "Iade taleplerinde urunun kullanilmamis, yeniden satilabilir nitelikte ve orijinal ambalaji ile gonderilmesi beklenir.",
          "Onaylanan iadelerde bedel, odeme yontemine uygun sekilde yasal sure icinde iade edilir.",
        ],
      },
      {
        heading: "Cayma Hakki Istisnalari",
        paragraphs: [
          "Mevzuat uyarinca cayma hakki kapsam disinda kalan urun veya hizmetlerde iade kabul edilmeyebilir.",
        ],
      },
    ],
  },
  {
    slug: "kullanim-kosullari",
    title: "Kullanim Kosullari",
    summary: "Site kullanimina iliskin genel sartlar, sorumluluklar ve fikri mulkiyet kurallari.",
    updatedAt: "08.07.2026",
    sections: [
      {
        heading: "Genel Hukumler",
        paragraphs: [
          "Siteyi kullanan herkes, bu kosullari okumus ve kabul etmis sayilir.",
        ],
      },
      {
        heading: "Fikri Mulkiyet",
        paragraphs: [
          "Sitede yer alan icerik, gorsel ve markalar ilgili mevzuat kapsaminda korunur. Izinsiz kopyalama ve ticari kullanim yasaktir.",
        ],
      },
      {
        heading: "Sorumlulugun Siniri",
        paragraphs: [
          "Site altyapisinda olusabilecek gecici kesinti veya teknik aksakliklarda, mevzuatin izin verdigi olcude sorumluluk sinirlanabilir.",
        ],
      },
    ],
  },
];

export function getLegalDocumentBySlug(slug: string) {
  return legalDocuments.find((document) => document.slug === slug);
}
