import type { Metadata } from "next";
import LegalDocumentEmbed, { buildLegalMetadata } from "../../components/LegalDocumentEmbed";

const SOURCE_URL = "https://booking.lineatoursguapiles.com/es/conditions/privacy-policy/";

export const metadata: Metadata = buildLegalMetadata({
  title: "Política de privacidad",
  sourceUrl: SOURCE_URL,
});

export default function PoliticaPrivacidadPage() {
  return (
    <LegalDocumentEmbed
      title="Política de privacidad"
      sourceUrl={SOURCE_URL}
      type="privacy"
      description="Contenido oficial de la política de privacidad publicada por Linea Tours Guapiles."
    />
  );
}
