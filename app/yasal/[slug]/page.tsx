import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalDocumentBySlug, legalDocuments } from "@/lib/legal-documents";

type LegalDocumentPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return legalDocuments.map((document) => ({ slug: document.slug }));
}

export async function generateMetadata({ params }: LegalDocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocumentBySlug(slug);

  if (!document) {
    return {
      title: "Yasal Metin Bulunamadi",
    };
  }

  return {
    title: document.title,
    description: document.summary,
    alternates: {
      canonical: `/yasal/${document.slug}`,
    },
    openGraph: {
      title: document.title,
      description: document.summary,
      url: `/yasal/${document.slug}`,
    },
  };
}

export default async function LegalDocumentDetailPage({ params }: LegalDocumentPageProps) {
  const { slug } = await params;
  const document = getLegalDocumentBySlug(slug);

  if (!document) {
    notFound();
  }

  return (
    <section className="page-shell">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
        <article className="panel space-y-5">
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <p className="hero-kicker">Yasal Metin</p>
            <h1 className="section-title">{document.title}</h1>
            <p className="section-sub">{document.summary}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">Son guncelleme: {document.updatedAt}</p>
          </div>

          {document.sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-800">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-slate-700">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <div className="pt-2">
            <Link href="/yasal" className="btn btn-secondary">
              Tum Sozlesmelere Don
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
