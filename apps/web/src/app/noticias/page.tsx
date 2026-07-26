'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicPageHero } from '@/components/public-page-hero';
import { api } from '@/lib/api';
import { fallbackImage, mapArticle } from '@/lib/content-mappers';
import { ArrowRight, CalendarDays, Newspaper, RadioTower } from 'lucide-react';

export default function NewsPage() {
  const [articles, setArticles] = useState<ReturnType<typeof mapArticle>[]>([]);

  useEffect(() => {
    api.articles('Noticias').then((items) => setArticles(items.map(mapArticle))).catch(() => setArticles([]));
  }, []);

  const featured = articles[0];
  const briefStories = articles.slice(1, 4);
  const rest = articles.slice(4);

  return (
    <div className="mx-auto grid max-w-7xl gap-8">
      <PublicPageHero
        eyebrow="Actualidad local"
        icon={Newspaper}
        title="Noticias"
        description="Historias, avisos y novedades para estar cerca de lo que pasa en Labranza y sus alrededores."
        action={<div className="rounded-full border border-amber-300/30 bg-amber-300/15 px-4 py-2 text-sm font-bold text-amber-100">Portada local</div>}
      />
      {articles.length ? (
        <>
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-start">
            {featured && (
              <Link className="group relative min-h-[420px] overflow-hidden rounded-xl border border-slate-900/10 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]" href={`/noticias/${featured.slug}`}>
                <img
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-82 transition duration-500 group-hover:scale-[1.03]"
                  onError={(event) => {
                    event.currentTarget.src = fallbackImage;
                  }}
                  src={featured.imageUrl ?? fallbackImage}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/58 to-slate-950/10" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase text-slate-950">
                    <RadioTower className="h-3.5 w-3.5" />
                    Apertura local
                  </span>
                  <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{featured.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">{featured.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-amber-200">
                    Leer historia completa <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )}
            <aside className="radio-panel rounded-lg p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">En desarrollo</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Ultimas actualizaciones</h2>
                </div>
                <CalendarDays className="h-5 w-5 text-amber-600" />
              </div>
              <div className="grid gap-3">
                {briefStories.map((article) => (
                  <Link className="group rounded-lg border border-slate-900/10 bg-white/72 p-4 transition hover:border-amber-300 hover:bg-amber-50" href={`/noticias/${article.slug}`} key={article.slug}>
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">{article.date}</span>
                    <strong className="mt-1 block line-clamp-2 text-base font-black leading-tight text-slate-950">{article.title}</strong>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{article.excerpt}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-slate-500 transition group-hover:text-amber-700">
                      Leer noticia <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
                {!briefStories.length && (
                  <div className="rounded-lg border border-dashed border-slate-900/10 bg-white/60 p-4 text-sm font-semibold text-slate-500">
                    Se iran sumando mas actualizaciones a esta portada.
                  </div>
                )}
              </div>
            </aside>
          </section>

          {rest.length > 0 && (
            <section className="radio-panel overflow-hidden rounded-xl">
              <div className="border-b border-slate-900/10 bg-white/70 px-4 py-4 sm:px-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Archivo reciente</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Mas noticias</h2>
              </div>
              <div className="divide-y divide-slate-900/10">
                {rest.map((article) => (
                  <Link className="group grid gap-3 px-4 py-4 transition hover:bg-amber-50/70 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center sm:px-5" href={`/noticias/${article.slug}`} key={article.slug}>
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">{article.date}</span>
                    <span className="min-w-0">
                      <strong className="block truncate text-base font-black text-slate-950">{article.title}</strong>
                      <span className="mt-1 line-clamp-1 block text-sm font-semibold text-slate-500">{article.excerpt}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition group-hover:text-amber-700">
                      Abrir <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="radio-panel rounded-lg p-6 text-sm font-semibold text-slate-600">
          Aun no hay noticias publicadas.
        </div>
      )}
    </div>
  );
}
