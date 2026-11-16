import type { Metadata } from "next";
import { LiveRequestForm } from "./live-form";

export const metadata: Metadata = { title: "Neue Anfrage" };

export default function NewRequestPage() {
  // Das Layout umschließt die Seite bereits mit <Suspense> (für useSearchParams).
  return <LiveRequestForm />;
}
