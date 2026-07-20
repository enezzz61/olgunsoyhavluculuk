import { absoluteUrl } from "@/lib/seo";

export default function TrackingHead() {
  return (
    <>
      <title>Kargo Takip | Olgunsoy Havluculuk</title>
      <meta
        name="description"
        content="Takip kodunu girerek siparişinin kargo durumunu ve hareketlerini sorgula."
      />
      <link rel="canonical" href={absoluteUrl("/kargo-takip")} />
    </>
  );
}