"use client";

import { useState, useEffect, useCallback } from "react";
import ValuesCompact from "../components/ValuesCompact";

const NOSOTROS_IMAGES = {
  hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=80",
  principal: "https://images.unsplash.com/photo-1586768019524-c6e902168263?q=80&w=1017&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  galeria: [
    "/uploads/clientes/clientes-guapiles-lineatours_Cliente_1.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Cliente_2.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Cliente_3.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Cliente_4.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Cliente_5.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Cliente_6.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Cliente_7.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Cliente_8.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Cliente_9.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9593.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9612.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9634.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9655.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9656.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9657.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9671.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9682.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9688.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9692.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9697.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9698.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9699.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9703.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9706.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9723.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9728.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9729.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9737.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9738.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9744.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9755.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9757.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_IMG_9764.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_1.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_12.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_13.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_18.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_19.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_2.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_20.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_22.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_32.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_40.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_42.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_43.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_44.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_photo_45.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Photo_47.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Photo_48.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Photo_51.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Photo_54.webp",
    "/uploads/clientes/clientes-guapiles-lineatours_Photo_55.webp",
  ],
};

const VALORES = [
  {
    title: "Honestidad",
    text: "Comunicamos cada detalle con claridad para que viajes con seguridad y sin sorpresas.",
  },
  {
    title: "Respeto",
    text: "Valoramos tu tiempo y tu inversión con procesos ordenados y atención puntual.",
  },
  {
    title: "Honradez",
    text: "Cumplimos lo que prometemos y respaldamos cada reserva con gestión profesional.",
  },
  {
    title: "Empatía",
    text: "Escuchamos tu contexto y adaptamos cada recomendación a tu momento de vida.",
  },
  {
    title: "Solidaridad",
    text: "Creamos experiencias grupales donde cada persona se siente acompañada desde el inicio.",
  },
];

function GalleryLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const total = images.length;

  const prev = useCallback(() => setCurrent((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent((i) => (i + 1) % total), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  // prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* close */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
        aria-label="Cerrar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* prev */}
      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 md:left-6"
        aria-label="Anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* image */}
      <div
        className="mx-16 flex max-h-[88vh] max-w-5xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={current}
          src={images[current]}
          alt=""
          className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl"
          style={{ animation: "fadeIn 0.2s ease" }}
        />
      </div>

      {/* next */}
      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 md:right-6"
        aria-label="Siguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* counter */}
      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
        {current + 1} / {total}
      </p>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

const PAGE_SIZE = 16;

export default function QuienesSomos() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });

  const openLightbox = (index: number) => setLightbox({ open: true, index });
  const closeLightbox = () => setLightbox({ open: false, index: 0 });

  return (
    <section className="relative overflow-hidden bg-[#f3f8f7] pb-16 text-slate-800 md:pb-24">
      <div className="pointer-events-none absolute -left-24 top-32 h-64 w-64 rounded-full bg-emerald-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative h-[340px] overflow-hidden md:h-[440px]">
        <img src={NOSOTROS_IMAGES.hero} alt="Costa de Costa Rica" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/35 via-sky-900/30 to-[#12313f]/80" />
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-6xl px-4 pb-8 text-white md:pb-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-cyan-100">Linea Tours</p>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">Sobre Nosotros</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-cyan-50 md:text-base">
            Creamos viajes bien estructurados para que vivas Costa Rica con tranquilidad, comodidad y emoción real.
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-6 max-w-6xl px-4 md:mt-8">
        <article className="grid overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_24px_64px_rgba(20,60,70,0.16)] backdrop-blur lg:grid-cols-[1.06fr_1fr]">
          <div className="relative min-h-[280px] lg:min-h-[440px]">
            <img src={NOSOTROS_IMAGES.principal} alt="Naturaleza de Costa Rica" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">+35 proveedores aliados</p>
              <p className="mt-2 text-lg font-extrabold">Red nacional e internacional para experiencias confiables.</p>
            </div>
          </div>

          <div className="p-6 md:p-8 lg:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Nuestra identidad</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">Quiénes Somos</h2>
            <p className="mt-5 leading-relaxed text-slate-600">
              Somos una agencia enfocada en convertir cada viaje en una experiencia bien cuidada, segura y memorable.
              Diseñamos rutas con estructura profesional para que disfrutes sin preocupaciones.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              Desde la primera consulta hasta el regreso a casa, trabajamos con acompañamiento real, información clara y
              atención personalizada para que tomes decisiones con confianza.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Destinos</p>
                <p className="mt-2 text-lg font-extrabold text-slate-800">Naturaleza, playa y ciudad</p>
              </div>
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Enfoque</p>
                <p className="mt-2 text-lg font-extrabold text-slate-800">Experiencias inolvidables</p>
              </div>
            </div>
          </div>
        </article>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40 p-6 shadow-sm md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Misión</p>
            <h3 className="mt-2 text-3xl font-black text-slate-900">Nuestra Misión</h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              Garantizar experiencias de viaje bien organizadas, seguras y memorables para que cada persona regrese con
              la tranquilidad de haber elegido correctamente.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              No solo planificamos tours: construimos confianza en cada etapa del viaje.
            </p>
          </article>

          <article className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-100/35 p-6 shadow-sm md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Visión</p>
            <h3 className="mt-2 text-3xl font-black text-slate-900">Nuestra Visión</h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              Ser la agencia referente para quienes buscan experiencias de viaje con respaldo, calidad operativa y trato
              humano.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Queremos que cada cliente nos recuerde por la tranquilidad que sintió antes, durante y después de viajar.
            </p>
          </article>
        </div>

        <ValuesCompact items={VALORES} />

        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <h3 className="text-center text-3xl font-black text-slate-900">Galería</h3>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-500 md:text-base">
            Momentos reales con nuestros clientes en Costa Rica.
          </p>

          <div className="mt-6 columns-2 gap-3 sm:columns-3 md:columns-4">
            {NOSOTROS_IMAGES.galeria.slice(0, visibleCount).map((image, idx) => (
              <div
                key={image}
                className="group mb-3 cursor-pointer overflow-hidden rounded-xl bg-slate-100 break-inside-avoid"
                onClick={() => openLightbox(idx)}
              >
                <img
                  src={image}
                  alt=""
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>

          {visibleCount < NOSOTROS_IMAGES.galeria.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisibleCount((v) => Math.min(v + PAGE_SIZE, NOSOTROS_IMAGES.galeria.length))}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-8 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
              >
                Ver más fotos ({NOSOTROS_IMAGES.galeria.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </section>
      </div>

      {lightbox.open && (
        <GalleryLightbox
          images={NOSOTROS_IMAGES.galeria}
          initialIndex={lightbox.index}
          onClose={closeLightbox}
        />
      )}
    </section>
  );
}