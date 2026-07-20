import { absoluteUrl } from "@/lib/seo";

export default function AdminLoginHead() {
  return (
    <>
      <title>Admin Girişi | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Sadece admin hesaplar için ayrılmış yönetim giriş sayfası."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/admin/giris")} />
    </>
  );
}