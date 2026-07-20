export default function HakkimizPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-4xl font-bold text-slate-900">Hakkımızda</h1>

        <section className="mb-12 rounded-lg bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-slate-800">
            Olgunsoy Havluculuk Nedir?
          </h2>
          <p className="mb-4 text-slate-700">
            Olgunsoy Havluculuk, toptancı ve perakende havlu operasyonunu dijitalde
            hızlandıran modern bir sipariş platformudur. Kuruluşundan itibaren, tekstil
            sektöründe verimliliği ve şeffaflığı artırmayı hedeflemektedir.
          </p>
        </section>

        <section className="mb-12 rounded-lg bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-slate-800">Misyonumuz</h2>
          <p className="mb-4 text-slate-700">
            Olgunsoy olarak, havlu işletmelerinin sipariş yönetimi, ürün kataloğu ve müşteri
            ilişkileri konularında teknoloji ile desteklenmesine inanıyoruz. Geleneksel
            yöntemlerin yerini modern, ölçeklenebilir çözümler almalıdır.
          </p>
        </section>

        <section className="mb-12 rounded-lg bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-slate-800">Hizmetlerimiz</h2>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start">
              <span className="mr-3 font-semibold text-cyan-600">✓</span>
              <span>
                <strong>Ürün Kataloğu:</strong> Kapsamlı havlu ürün gamımızı toptancı
                ve perakende fiyatlandırması ile sunarız.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-semibold text-cyan-600">✓</span>
              <span>
                <strong>Güvenli Sipariş Yönetimi:</strong> Herhangi bir konuma hızlı ve
                güvenli bir şekilde sipariş verilebilir.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-semibold text-cyan-600">✓</span>
              <span>
                <strong>Kargo Takibi:</strong> Siparişinizin her aşamasını gerçek zamanlı
                olarak takip edebilirsiniz.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-semibold text-cyan-600">✓</span>
              <span>
                <strong>Hesap Yönetimi:</strong> Önceki siparişlerinizi görüntüleyin ve
                hesabınızı yönetin.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-semibold text-cyan-600">✓</span>
              <span>
                <strong>Çeşitli Ödeme Yöntemleri:</strong> SSL ve PCI-DSS uyumlu güvenli
                ödeme altyapısı.
              </span>
            </li>
          </ul>
        </section>

        <section className="mb-12 rounded-lg bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-slate-800">
            İletişim ve Destek
          </h2>
          <p className="mb-4 text-slate-700">
            Toptan satış, otel projeleri ve özel üretim talepleri için bize
            ulaşabilirsiniz.
          </p>
          <p className="text-slate-700">
            <strong>E-posta:</strong> destek@olgunsoy.com
          </p>
        </section>
      </div>
    </main>
  );
}
