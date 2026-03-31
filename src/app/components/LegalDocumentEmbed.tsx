import type { Metadata } from "next";
import Link from "next/link";
import { load } from "cheerio";

export type LegalPageConfig = {
  title: string;
  sourceUrl: string;
  description?: string;
  type?: "legal" | "general" | "privacy" | "cookies";
};

export function buildLegalMetadata(config: LegalPageConfig): Metadata {
  return {
    title: `${config.title} | Guapiles Linea Tours`,
    description:
      config.description ??
      `Consulta ${config.title.toLowerCase()} de Guapiles Linea Tours.`,
  };
}

async function extractLegalContent({ sourceUrl, type }: LegalPageConfig): Promise<string | null> {
  try {
    const response = await fetch(sourceUrl, {
      next: { revalidate: 60 * 60 * 6 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = load(html, { decodeEntities: false });

    $("script, style, noscript, iframe, header, footer, nav").remove();

    let container = null;

    if (type === "general") {
      container = $("#main.container-limited").first().clone();
      container.find("p.save, ul#service_type").remove();
    } else {
      const candidates = $("main#thecontent .container-limited").filter((_, el) => {
        const node = $(el);
        const text = node.text().toLowerCase();
        return (
          node.find("h1").length > 0 &&
          !text.includes("si quieres guardar estas condiciones") &&
          !text.includes("mi cuenta")
        );
      });

      container = (candidates.first().length ? candidates.first() : $("main#thecontent")).clone();
    }

    if (!container || !container.length) {
      return null;
    }

    container.find("a[href^='javascript:print']").remove();
    container.find(".save, #service_type").remove();
    container.find("img, svg, button").remove();
    container.find("a[href*='onlinetravel.es'], a[href*='wa.me']").remove();

    const cleaned = (container.html() ?? "").trim();
    return cleaned.length > 0 ? cleaned : null;
  } catch {
    return null;
  }
}

export default async function LegalDocumentEmbed({ title, sourceUrl, description, type }: LegalPageConfig) {
  const legalContentHtml = await extractLegalContent({ title, sourceUrl, description, type });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Menu legal</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{title}</h1>
        {description ? <p className="mt-3 text-sm text-slate-600">{description}</p> : null}
      </div>

      {legalContentHtml ? (
        <article
          className="rounded-2xl bg-white p-6 text-[15px] leading-7 text-slate-800 shadow-sm ring-1 ring-slate-200 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_strong]:font-semibold [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: legalContentHtml }}
        />
      ) : (
        <div className="rounded-2xl bg-white p-6 text-slate-700 shadow-sm ring-1 ring-slate-200">
          <p>No se pudo cargar automaticamente el contenido legal.</p>
          <p className="mt-3">
            Puedes abrir la version oficial aqui: {" "}
            <Link className="font-semibold text-emerald-700 hover:text-emerald-600" href={sourceUrl} target="_blank" rel="noopener noreferrer">
              {title}
            </Link>
            .
          </p>
        </div>
      )}
    </section>
  );
}
