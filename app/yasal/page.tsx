import type { Metadata } from "next";
import Link from "next/link";
import { legalDocuments } from "@/lib/legal-documents";

export const metadata: Metadata = {
  title: "Yasal Sozlesmeler",
  description: "KVKK, gizlilik, cerez, mesafeli satis, on bilgilendirme ve iade politikasi metinleri.",
  alternates: {
    canonical: "/yasal",
  },
  openGraph: {
    title: "Yasal Sozlesmeler",
    description: "Olgunsoy Havluculuk yasal metinleri ve sozlesmeler.",
    url: "/yasal",
  },
};

export default function LegalDocumentsPage() {
  return (
    <section className="page-shell">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <div className="panel space-y-3">
          <p className="hero-kicker">Yasal Bilgilendirme</p>
          <h1 className="section-title">Sozlesmeler ve Politikalar</h1>
          <p className="section-sub">
            Alisveris oncesi ve sonrasi tum sureclerde gecerli sozlesme ve politikalari bu sayfadan inceleyebilirsiniz.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {legalDocuments.map((document) => (
            <article key={document.slug} className="panel space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">{document.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{document.summary}</p>
              </div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Son guncelleme: {document.updatedAt}</p>
              <Link href={`/yasal/${document.slug}`} className="btn btn-secondary">
                Metni Goruntule
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
