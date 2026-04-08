"use client";

import React from 'react';
import ContactUnifiedForm from '../components/ContactUnifiedForm';

export default function ContactoPage() {
  return (
    <section className="pb-10 md:pb-12">
      <div className="border-b border-slate-200 bg-[#F2FAEF]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Guapiles Linea Tours Support</p>
          <h1 className="mt-2 text-3xl font-black text-emerald-800 md:text-5xl">Hablemos de tu proxima aventura</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-lg">
            Nuestro equipo te ayudara a elegir el tour ideal, resolver dudas de fechas y preparar una experiencia a medida.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-6xl px-4 md:mt-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.45fr] lg:items-start">
          <aside className="space-y-3.5 md:space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Telefono</p>
            <p className="mt-1.5 text-sm font-bold leading-snug text-emerald-700 md:text-base">+506 7154-6738</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Atencion de lunes a domingo de 8:00 AM a 5:00 PM.</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">E-mail</p>
            <a
              href="mailto:atencionalcliente@guapileslineatours.com"
              className="mt-1.5 block max-w-full text-sm font-bold leading-snug text-emerald-700 break-words [overflow-wrap:anywhere] md:text-base"
            >
              atencionalcliente@guapileslineatours.com
            </a>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Respondemos en menos de 24 horas habiles.</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Ubicacion</p>
            <p className="mt-1.5 text-sm font-bold leading-snug text-emerald-700 md:text-base">Costa Rica, Limon, Pococi, La Colonia</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Citas presenciales con cita previa.</p>
          </article>
          </aside>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-2xl font-extrabold text-emerald-800">Envianos tu consulta</h2>
            <p className="mt-2 text-sm text-slate-600">Completa el formulario y te contactamos rapidamente con opciones sugeridas.</p>

            <div className="mt-5">
              <ContactUnifiedForm className="grid gap-4 md:grid-cols-2" />
            </div>
          </article>
        </div>

        <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-extrabold text-emerald-800">Preguntas frecuentes</h3>
          <div className="mt-3 space-y-2">
            <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Cuanto tarda en responder?</summary>
              <p className="mt-2 text-sm text-slate-600">Entre 2 y 24 horas, segun la carga de solicitudes.</p>
            </details>
            <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Puedo pagar mi reserva a mitad?</summary>
              <p className="mt-2 text-sm text-slate-600">Depende del tour. Escribenos y te confirmamos las opciones de pago disponibles.</p>
            </details>
            <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Atienden por WhatsApp?</summary>
              <p className="mt-2 text-sm text-slate-600">Si, al escribirnos por telefono te guiamos tambien por ese canal.</p>
            </details>
          </div>
        </article>
      </div>
    </section>
  );
}
