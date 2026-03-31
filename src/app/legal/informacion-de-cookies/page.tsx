import type { Metadata } from "next";
import LegalDocumentEmbed, { buildLegalMetadata } from "../../components/LegalDocumentEmbed";

const SOURCE_URL = "https://booking.lineatoursguapiles.com/es/conditions/cookies/";

export const metadata: Metadata = buildLegalMetadata({
  title: "Informacion de cookies",
  sourceUrl: SOURCE_URL,
});

export default function InformacionCookiesPage() {
  return (
    <LegalDocumentEmbed
      title="Informacion de cookies"
      sourceUrl={SOURCE_URL}
      type="cookies"
      description="Contenido oficial de informacion de cookies publicado por Linea Tours Guapiles."
    />
  );
}
