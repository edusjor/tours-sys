import ValuesCompact from "../components/ValuesCompact";

const NOSOTROS_IMAGES = {
  hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=80",
  principal: "https://images.unsplash.com/photo-1586768019524-c6e902168263?q=80&w=1017&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",



  galeria: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/CostaRica_Arenal_Volcano_(pixinn.net).jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Parque_Nacional_Manuel_Antonio_02.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/IMGbeachmanuelantonio.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Tortuguero_boat_trip.JPG",
    "https://commons.wikimedia.org/wiki/Special:FilePath/TortugueroBeach.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Tortuguero_Palm_Forests.JPG",
    "https://commons.wikimedia.org/wiki/Special:FilePath/TortugueroPark.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Costa_rica_santa_elena_skywalk.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Panorama4_Poas_volcano_crater.jpg",
    "https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=1200&q=80",
  ],
};

const VALORES = [
  {
    title: "Honestidad",
    text: "Comunicamos cada detalle con claridad para que viajes con seguridad y sin sorpresas.",
  },
  {
    title: "Respeto",
    text: "Valoramos tu tiempo y tu inversion con procesos ordenados y atencion puntual.",
  },
  {
    title: "Honradez",
    text: "Cumplimos lo que prometemos y respaldamos cada reserva con gestion profesional.",
  },
  {
    title: "Empatia",
    text: "Escuchamos tu contexto y adaptamos cada recomendacion a tu momento de vida.",
  },
  {
    title: "Solidaridad",
    text: "Creamos experiencias grupales donde cada persona se siente acompanada desde el inicio.",
  },
];

export default function QuienesSomos() {
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
            Creamos viajes bien estructurados para que vivas Costa Rica con tranquilidad, comodidad y emocion real.
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
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">Quienes Somos</h2>
            <p className="mt-5 leading-relaxed text-slate-600">
              Somos una agencia enfocada en convertir cada viaje en una experiencia bien cuidada, segura y memorable.
              Disenamos rutas con estructura profesional para que disfrutes sin preocupaciones.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              Desde la primera consulta hasta el regreso a casa, trabajamos con acompanamiento real, informacion clara y
              atencion personalizada para que tomes decisiones con confianza.
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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Mision</p>
            <h3 className="mt-2 text-3xl font-black text-slate-900">Nuestra Mision</h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              Garantizar experiencias de viaje bien organizadas, seguras y memorables para que cada persona regrese con
              la tranquilidad de haber elegido correctamente.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              No solo planificamos tours: construimos confianza en cada etapa del viaje.
            </p>
          </article>

          <article className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-100/35 p-6 shadow-sm md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Vision</p>
            <h3 className="mt-2 text-3xl font-black text-slate-900">Nuestra Vision</h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              Ser la agencia referente para quienes buscan experiencias de viaje con respaldo, calidad operativa y trato
              humano.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Queremos que cada cliente nos recuerde por la tranquilidad que sintio antes, durante y despues de viajar.
            </p>
          </article>
        </div>

        <ValuesCompact items={VALORES} />

        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <h3 className="text-center text-3xl font-black text-slate-900">Galeria</h3>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-500 md:text-base">
            Un vistazo a escenarios naturales y momentos que inspiran nuestros itinerarios.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-12 md:grid-rows-2">
            {NOSOTROS_IMAGES.galeria.map((image, idx) => {
              const wide = idx === 0 || idx === 4;
              return (
                <div
                  key={`${image}-${idx}`}
                  className={`group overflow-hidden rounded-2xl bg-slate-200 ${wide ? "md:col-span-6" : "md:col-span-3"}`}
                >
                  <img
                    src={image}
                    alt={`Galeria sobre nosotros ${idx + 1}`}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-52"
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}