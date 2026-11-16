import { LogoMark } from "@/components/brand";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main
      id="inhalt"
      className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
    >
      <LogoMark className="size-12" />
      <p className="mt-8 text-sm font-semibold text-accent-600">Fehler 404</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        Seite nicht gefunden
      </h1>
      <p className="mt-2 max-w-sm text-muted">
        Diese Seite gibt es nicht (mehr). Prüfen Sie die Adresse.
      </p>
      <LinkButton href="/" className="mt-6">
        Zur Startseite
      </LinkButton>
    </main>
  );
}
