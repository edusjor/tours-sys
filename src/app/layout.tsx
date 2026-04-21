import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Nunito, Kaushan_Script } from "next/font/google";
import SiteHeader from "./components/SiteHeader";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const kaushan = Kaushan_Script({
  variable: "--font-kaushan",
  subsets: ["latin"],
  weight: ["400"],
});

const BRAND_LOGO_URL = "https://guapileslineatours.com/uploads/site/logo-guapiles-linea-tours.png";

export const metadata: Metadata = {
  title: {
    default: "Guápiles Linea Tours | Agencia de Viajes en Costa Rica",
    template: "%s | Guápiles Linea Tours",
  },
  description:
    "Agencia de viajes en Guápiles, Costa Rica. Tours nacionales e internacionales, turismo rural, playa y aventura con atención personalizada. Reserva fácil y segura.",
  keywords: [
    "tours Costa Rica",
    "agencia de viajes Guápiles",
    "turismo rural Costa Rica",
    "tours nacionales Costa Rica",
    "Linea Tours",
    "Guápiles Linea Tours",
    "tours Limón",
    "viajes Costa Rica",
  ],
  openGraph: {
    type: "website",
    locale: "es_CR",
    siteName: "Guápiles Linea Tours",
    title: "Guápiles Linea Tours | Agencia de Viajes en Costa Rica",
    description:
      "Tours nacionales e internacionales desde Guápiles. Turismo rural, playa y aventura con acompañamiento real desde el primer contacto.",
    images: [{ url: "https://guapileslineatours.com/uploads/site/logo-guapiles-linea-tours.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const performancePolyfill = `(function(){
    if (typeof window === "undefined") return;
    var perf = window.performance;
    if (!perf) return;
    try {
      if (typeof perf.clearMarks !== "function") perf.clearMarks = function() {};
      if (typeof perf.clearMeasures !== "function") perf.clearMeasures = function() {};
    } catch (e) {
      try {
        Object.defineProperty(perf, "clearMarks", {
          configurable: true,
          writable: true,
          value: function() {},
        });
      } catch (_) {}
      try {
        Object.defineProperty(perf, "clearMeasures", {
          configurable: true,
          writable: true,
          value: function() {},
        });
      } catch (_) {}
    }
  })();`;

  return (
    <html lang="es">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QBXGEYZE9E"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QBXGEYZE9E');
          `}
        </Script>
        <script dangerouslySetInnerHTML={{ __html: performancePolyfill }} />
      </head>
      <body className={`${nunito.variable} ${kaushan.variable} min-h-screen bg-slate-100 text-slate-900`}>
        <SiteHeader />
        <main>{children}</main>
        <footer className="mt-12 bg-slate-900 py-10 text-slate-200">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3 md:items-start">
            <div>
              <Link href="/" aria-label="Guápiles Linea Tours" className="inline-flex items-center">
                <img
                  src={BRAND_LOGO_URL}
                  alt="Guápiles Linea Tours"
                  className="h-16 w-auto max-w-[260px] object-contain"
                  loading="lazy"
                />
              </Link>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Menú</p>
              <nav className="grid gap-2 text-sm font-semibold">
                <Link href="/">Inicio</Link>
                <Link href="/tours">Tours</Link>
                <Link href="/quienes-somos">Sobre nosotros</Link>
                <Link href="/contacto">Contacto</Link>
              </nav>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Legal</p>
              <nav className="grid gap-2 text-sm font-semibold">
                <Link href="/legal/aviso-legal">Aviso legal</Link>
                <Link href="/legal/terminos-y-condiciones-generales">Términos y condiciones generales</Link>
                <Link href="/legal/politica-de-privacidad">Política de privacidad</Link>
                <Link href="/legal/informacion-de-cookies">Información de cookies</Link>
              </nav>
            </div>
            <p className="text-xs text-slate-400 md:col-span-3">© 2026 Guápiles Linea Tours. Todos los derechos reservados.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
