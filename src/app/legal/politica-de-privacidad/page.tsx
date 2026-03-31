import type { Metadata } from "next";
import LegalDocumentEmbed, { buildLegalMetadata } from "../../components/LegalDocumentEmbed";

const SOURCE_URL = "https://booking.lineatoursguapiles.com/es/conditions/privacy-policy/";

export const metadata: Metadata = buildLegalMetadata({
  title: "Politica de privacidad",
  sourceUrl: SOURCE_URL,
});

export default function PoliticaPrivacidadPage() {
  return (
    <LegalDocumentEmbed
      title="Politica de privacidad"
      sourceUrl={SOURCE_URL}
      type="privacy"
      description="Contenido oficial de la politica de privacidad publicada por Linea Tours Guapiles."
    />
  );
}
