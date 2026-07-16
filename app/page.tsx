import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";

export const metadata: Metadata = {
  title: "Ana Sayfa",
  description: "Olgunsoy Havluculuk toptanci ve perakende havlu koleksiyonu, kampanyalar ve hizli siparis akisi.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Olgunsoy Havluculuk",
    description: "Toptanci ve perakende havlu alisverisi icin modern katalog ve hizli siparis deneyimi.",
    url: "/",
  },
};

export default function Home() {
  return <HomePage />;
}
