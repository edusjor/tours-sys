"use client";

import { useMemo, useState } from "react";

type ValueItem = {
  title: string;
  text: string;
};

type ValuesCompactProps = {
  items: ValueItem[];
};

export default function ValuesCompact({ items }: ValuesCompactProps) {
  const safeItems = useMemo(() => items.filter((item) => item.title && item.text), [items]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!safeItems.length) return null;

  const current = safeItems[Math.min(activeIndex, safeItems.length - 1)];

  return (
    <article className="mt-8 rounded-3xl border border-slate-200 bg-[#f7fbfb] p-5 shadow-sm md:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Valores</p>
          <h3 className="mt-2 text-3xl font-black text-slate-900">Nuestros Valores</h3>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {safeItems.map((valor, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={valor.title}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`rounded-full border px-4 py-2 text-sm font-extrabold transition-colors ${
                isActive
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
              }`}
              aria-pressed={isActive}
            >
              {valor.title}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <p className="text-xl font-black text-slate-900">{current.title}</p>
        <p className="mt-2 text-base leading-relaxed text-slate-600">{current.text}</p>
      </div>
    </article>
  );
}