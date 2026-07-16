import { absoluteUrl } from "@/lib/seo";

export default function RegisterHead() {
  return (
    <>
      <title>Kayit Ol | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Perakende veya toptanci hesabini olustur, fiyatlari rolune gore gor."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={absoluteUrl("/hesap/kayit")} />
    </>
  );
}