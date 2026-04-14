import type { Metadata } from "next";
import LegalDocumentEmbed, { buildLegalMetadata } from "../../components/LegalDocumentEmbed";

const SOURCE_URL = "https://booking.lineatoursguapiles.com/es/conditions/all-general/";

export const metadata: Metadata = buildLegalMetadata({
  title: "Términos y condiciones generales",
  sourceUrl: SOURCE_URL,
});

export default function TerminosCondicionesPage() {
  return (
    <LegalDocumentEmbed
      title="Términos y condiciones generales"
      sourceUrl={SOURCE_URL}
      type="general"
      description="Contenido oficial de términos y condiciones generales publicado por Linea Tours Guapiles."
    />
  );
}
