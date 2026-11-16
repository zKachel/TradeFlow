import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TradeFlow (Demo)",
    short_name: "TradeFlow",
    description:
      "Aufträge finden und organisieren – für Auftraggeber und Handwerksbetriebe. Demo-Version.",
    lang: "de",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f6f5f1",
    theme_color: "#0f5045",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Neue Anfrage", url: "/kunde/anfrage/neu" },
      { name: "Firmen-Dashboard", url: "/betrieb" },
    ],
  };
}
