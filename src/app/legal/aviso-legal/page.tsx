import type { Metadata } from "next";
import LegalDocumentEmbed, { buildLegalMetadata } from "../../components/LegalDocumentEmbed";

const SOURCE_URL = "https://booking.lineatoursguapiles.com/es/conditions/legal/";

export const metadata: Metadata = buildLegalMetadata({
  title: "Aviso legal",
  sourceUrl: SOURCE_URL,
});

export default function AvisoLegalPage() {
  return (
    <LegalDocumentEmbed
      title="Aviso legal"
      sourceUrl={SOURCE_URL}
      type="legal"
      description="Contenido oficial de aviso legal publicado por Linea Tours Guapiles."
    />
  );
}
