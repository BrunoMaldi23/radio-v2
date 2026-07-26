'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Disc3, Headphones, Music2, RadioTower, Sparkles } from 'lucide-react';
import { PublicPageHero } from '@/components/public-page-hero';
import { api } from '@/lib/api';
import { fallbackImage, mapArticle } from '@/lib/content-mappers';

type HitArticle = ReturnType<typeof mapArticle>;

const articlePath = (slug: string) => `/exitos/${slug}`;

function ArticleImage({ article, className = '', shade = true }: { article: HitArticle; className?: string; shade?: boolean }) {
  return (
    <span className={`relative block overflow-hidden bg-slate-950 ${className}`}>
      <img
        alt=""
        className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
        onError={(event) => {
          event.currentTarget.src = fallbackImage;
        }}
        src={article.imageUrl ?? fallbackImage}
      />
      {shade && <span className="absolute inset-0 bg-gradient-to-t from-slate-950/86 via-slate-950/18 to-transparent" />}
    </span>
  );
}

function HitSpecialCard({ article, index }: { article: HitArticle; index: number }) {
  return (
    <Link
      className="group overflow-hidden rounded-xl border border-slate-900/10 bg-white/88 shadow-[0_18px_52px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:border-amber-300 hover:bg-white hover:shadow-[0_26px_72px_rgba(15,23,42,0.14)]"
      href={articlePath(article.slug)}
    >
      <span className="relative block">
        <ArticleImage article={article} className="aspect-[16/10]" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/88 px-3 py-1.5 text-[11px] font-black uppercase text-amber-200 ring-1 ring-white/10 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Especial {String(index + 1).padStart(2, '0')}
        </span>
      </span>
      <span className="block p-5">
        <span className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-amber-700">
            <Disc3 className="h-3.5 w-3.5" />
            90's y 2000's
          </span>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-950 text-amber-300 transition group-hover:bg-amber-400 group-hover:text-slate-950">
            <Music2 className="h-4 w-4" />
          </span>
        </span>
        <strong className="mt-3 line-clamp-2 block text-xl font-black leading-tight text-slate-950">
          {article.title}
        </strong>
        <span className="mt-2 line-clamp-2 block text-sm font-semibold leading-6 text-slate-600">
          {article.excerpt}
        </span>
        <span className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase text-slate-500 transition group-hover:text-amber-700">
          Ver especial <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="h-72 animate-pulse rounded-xl bg-slate-950/10" key={item} />
        ))}
      </div>
    </div>
  );
}

export default function HitsPage() {
  const [articles, setArticles] = useState<HitArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    api.articles('Exitos 90,2000')
      .then((items) => {
        if (isMounted) setArticles(items.map(mapArticle));
      })
      .catch(() => {
        if (isMounted) setArticles([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleArticles = articles.slice(0, 3);

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <PublicPageHero
        eyebrow="Archivo musical"
        icon={Headphones}
        title="90's y 2000's"
        description="Especiales, recuerdos y canciones que marcaron una epoca. Una portada simple, visual y directa para descubrir contenidos destacados."
        action={
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/12 px-3 py-2 text-xs font-black uppercase text-cyan-100">
              <RadioTower className="h-3.5 w-3.5" />
              En rotacion
            </span>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-2 text-xs font-black uppercase text-amber-100">
              Solo 3 destacados
            </span>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : articles.length ? (
        <section className="grid gap-4" aria-label="Especiales 90 y 2000">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Seleccion editorial</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Especiales destacados</h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-slate-600">
              Una vitrina breve para entrar rapido a los contenidos principales.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {visibleArticles.map((article, index) => (
              <HitSpecialCard article={article} index={index} key={article.slug} />
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-slate-900/10 bg-white/78 p-8 text-center shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
          <p className="text-lg font-black text-slate-950">No hay especiales para mostrar.</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Publica nuevos contenidos de Exitos 90 y 2000 desde el panel.
          </p>
        </div>
      )}
    </div>
  );
}
