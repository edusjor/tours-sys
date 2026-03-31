import type { Metadata } from "next";
import Link from "next/link";
import { Nunito, Kaushan_Script } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Guapiles Linea Tours",
  description: "Sitio web de tours y aventuras en Costa Rica",
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
        <script dangerouslySetInnerHTML={{ __html: performancePolyfill }} />
      </head>
      <body className={`${nunito.variable} ${kaushan.variable} min-h-screen bg-slate-100 text-slate-900`}>
        <header className="site-header">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" aria-label="Guapiles Linea Tours" className="inline-flex items-center">
              <img
                src="https://guapileslineatours.com/wp-content/uploads/2025/11/logo-lineatours.png"
                alt="Guapiles Linea Tours"
                className="h-12 w-auto max-w-[180px] object-contain md:h-14 md:max-w-[220px]"
                loading="eager"
              />
            </Link>
            <nav className="hidden gap-6 text-sm font-bold uppercase tracking-wide text-slate-100 md:flex">
              <Link href="/">Inicio</Link>
              <Link href="/tours">Tours</Link>
              <Link href="/quienes-somos">Nosotros</Link>
              <Link href="/contacto">Contacto</Link>
            </nav>
            <Link
              href="/tours"
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 shadow-lg shadow-amber-900/20 transition hover:bg-amber-300"
            >
              Reserva ahora
            </Link>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-12 bg-slate-900 py-10 text-slate-200">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3 md:items-start">
            <div>
              <p className="text-2xl font-extrabold text-white">Guapiles Linea Tours</p>
              <p className="text-sm text-slate-400">Tours de prueba para desarrollo y demostraciones.</p>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Menu</p>
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
                <Link href="/legal/terminos-y-condiciones-generales">Terminos y condiciones generales</Link>
                <Link href="/legal/politica-de-privacidad">Politica de privacidad</Link>
                <Link href="/legal/informacion-de-cookies">Informacion de cookies</Link>
              </nav>
            </div>
            <p className="text-xs text-slate-400 md:col-span-3">© 2026 Guapiles Linea Tours. Todos los derechos reservados.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
