import { absoluteUrl } from "@/lib/seo";

export default function AdminLoginHead() {
  return (
    <>
      <title>Admin Girisi | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Sadece admin hesaplar icin ayrilmis yonetim giris sayfasi."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/admin/giris")} />
    </>
  );
}