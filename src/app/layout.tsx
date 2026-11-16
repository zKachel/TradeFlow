import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: {
    default: "TradeFlow – Aufträge finden und organisieren (Demo)",
    template: "%s · TradeFlow",
  },
  description:
    "TradeFlow verbindet Auftraggeber mit Handwerks- und Dienstleistungsbetrieben und hilft Betrieben, eigene Aufträge, Team und Termine zu organisieren. Demo-Version.",
  applicationName: "TradeFlow",
  appleWebApp: { capable: true, title: "TradeFlow", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0f5045",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
