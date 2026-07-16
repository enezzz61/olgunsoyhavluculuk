"use client";

import { useEffect, useMemo, useState } from "react";
import { getLegalDocumentBySlug, legalDocuments } from "@/lib/legal-documents";

type LegalDocumentTriggerProps = {
  label: string;
  className?: string;
  slug?: string;
};

export function LegalDocumentTrigger({ label, className, slug }: LegalDocumentTriggerProps) {
  const [open, setOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string>(() => slug || legalDocuments[0]?.slug || "");

  const selected = useMemo(() => {
    return getLegalDocumentBySlug(selectedSlug) || legalDocuments[0];
  }, [selectedSlug]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`cursor-pointer bg-transparent p-0 text-left ${className || ""}`}
        onClick={() => {
          setSelectedSlug(slug || legalDocuments[0]?.slug || "");
          setOpen(true);
        }}
      >
        {label}
      </button>

      {open ? (
        <div
          className="legal-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={selected?.title || "Yasal metin"}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div className="legal-modal-shell">
            {!slug ? (
              <aside className="legal-modal-menu">
                <p className="text-xs uppercase tracking-wide text-slate-500">Sozlesmeler</p>
                <div className="mt-2 space-y-1">
                  {legalDocuments.map((document) => (
                    <button
                      key={document.slug}
                      type="button"
                      onClick={() => setSelectedSlug(document.slug)}
                      className={`legal-menu-item ${selectedSlug === document.slug ? "legal-menu-item-active" : ""}`}
                    >
                      {document.title}
                    </button>
                  ))}
                </div>
              </aside>
            ) : null}

            <article className="legal-a4-paper">
              <header className="legal-paper-header">
                <div>
                  <p className="hero-kicker">Yasal Metin</p>
                  <h2 className="text-xl font-extrabold text-slate-800">{selected?.title}</h2>
                  <p className="text-sm text-slate-600">{selected?.summary}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Son guncelleme: {selected?.updatedAt}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Kapat
                </button>
              </header>

              <div className="legal-paper-body">
                {selected?.sections.map((section) => (
                  <section key={section.heading} className="space-y-2">
                    <h3 className="text-base font-bold text-slate-800">{section.heading}</h3>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-relaxed text-slate-700">
                        {paragraph}
                      </p>
                    ))}
                  </section>
                ))}
              </div>
            </article>
          </div>
        </div>
      ) : null}
    </>
  );
}
