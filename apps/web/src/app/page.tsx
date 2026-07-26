'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Headphones,
  Music2,
  Newspaper,
  Play,
  Radio,
  SignalHigh,
  Sparkles,
  Trophy,
  Tv,
  UsersRound
} from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { fallbackImage, mapArticle } from '@/lib/content-mappers';

const liveSignals = [
  { title: 'Audio en vivo', description: 'Radio Hit 90 y 2000', icon: Radio, href: '/tv' },
  { title: 'TV Digital', description: 'Estudio y transmision', icon: Tv, href: '/tv' },
  { title: 'Ranking', description: 'Votacion de la audiencia', icon: Trophy, href: '/ranking' },
  { title: 'Comunidad', description: 'Eventos y memoria local', icon: UsersRound, href: '/comunidad' }
];

export default function Home() {
  const [articles, setArticles] = useState<ReturnType<typeof mapArticle>[]>([]);
  const [newArticles, setNewArticles] = useState<ReturnType<typeof mapArticle>[]>([]);
  const [ranking, setRanking] = useState<{ id: number; title: string; artist: string; votes: number; artworkUrl: string | null; isActive: boolean }[]>([]);

  useEffect(() => {
    Promise.all([
      api.articles('Noticias').then((items) => items.map(mapArticle)).catch(() => [] as ReturnType<typeof mapArticle>[]),
      api.articles('Exitos 90,2000').then((items) => items.map(mapArticle)).catch(() => [] as ReturnType<typeof mapArticle>[]),
      api.ranking().catch(() => []),
    ]).then(([articles, newArticles, ranking]) => {
      setArticles(articles);
      setNewArticles(newArticles);
      setRanking(ranking);
    });
  }, []);

  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1, 3);
  const topSong = ranking[0];

  return (
    <div className="home-shell mx-auto grid max-w-7xl gap-8">
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-logo-card">
            <Image alt="Radio Hit 90 y 2000" className="h-24 w-auto object-contain sm:h-28" height={420} priority src="/logo-home.jpeg" width={420} />
          </div>
          <div>
            <p className="home-live-eyebrow">
              <span className="h-2 w-2 rounded-full bg-rose-400 live-dot" />
              Los exitos que marcaron tu vida
            </p>
            <h1>Radio Hit 90 y 2000 online.</h1>
            <p>
              Musica de los 90&apos;s y 2000&apos;s, noticias, TV en vivo y comunidad en una experiencia moderna, clara y conectada.
            </p>
          </div>
          <div className="home-hero-actions">
            <Button asChild className="home-primary-action">
              <Link href="/tv">
                <Play className="h-4 w-4" />
                Ver en vivo
              </Link>
            </Button>
            <Button asChild className="home-secondary-action" variant="outline">
              <Link href="/noticias">
                Ultimas noticias
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="home-signal-row">
            {liveSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <Link href={signal.href} key={signal.title}>
                  <Icon className="h-4 w-4" />
                  <span>{signal.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="home-live-console">
          <div className="home-live-media">
            <div className="home-live-media-image" />
            <div className="home-onair-card">
              <span>
                <SignalHigh className="h-4 w-4" />
                Ahora en vivo
              </span>
              <strong>Radio Hit 90 y 2000</strong>
              <p>La cabina de los exitos que marcaron tu vida.</p>
              <div className="home-status-row">
                <small>
                  <span className="home-status-dot" />
                  Senal online
                </small>
                <small>Dial online</small>
                <small>{topSong ? 'Ranking activo' : 'Ranking pronto'}</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-live-grid" aria-label="Accesos principales">
        {liveSignals.map((signal) => {
          const Icon = signal.icon;
          return (
            <Link
              className="home-live-card group"
              href={signal.href}
              key={signal.title}
            >
              <span>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <small>
                  <span className="h-2 w-2 rounded-full bg-rose-500 live-dot" />
                  En vivo
                </small>
                <strong>{signal.title}</strong>
                <p>{signal.description}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-amber-600" />
            </Link>
          );
        })}
      </section>

      <section className="home-command-grid">
        <div className="home-news-lab">
          <SectionHeading eyebrow="Actualidad local" href="/noticias" title="Lo ultimo en Labranza" />
          {featuredArticle ? (
            <div className="home-news-layout">
              <Link className="group relative min-h-[360px] overflow-hidden rounded-xl bg-slate-950 text-white shadow-[0_22px_64px_rgba(15,23,42,0.14)]" href={`/noticias/${featuredArticle.slug}`}>
                <img
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.03]"
                  onError={(event) => {
                    event.currentTarget.src = fallbackImage;
                  }}
                  src={featuredArticle.imageUrl ?? fallbackImage}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/58 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase text-slate-950">
                    <Newspaper className="h-3.5 w-3.5" />
                    Portada local
                  </span>
                  <h3 className="mt-4 text-3xl font-black leading-tight">{featuredArticle.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200">{featuredArticle.excerpt}</p>
                </div>
              </Link>
              <div className="home-news-stack">
                {secondaryArticles.length ? secondaryArticles.map((article) => (
                  <Link className="home-mini-story" href={`/noticias/${article.slug}`} key={article.slug}>
                    <span>
                      <Newspaper className="h-4 w-4" />
                      {article.category}
                    </span>
                    <strong>{article.title}</strong>
                    <p>{article.excerpt}</p>
                  </Link>
                )) : (
                  <div className="home-empty-compact">
                    <CalendarDays className="h-5 w-5" />
                    Se iran sumando mas historias locales.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="radio-panel grid min-h-72 place-items-center rounded-lg border-dashed p-6 text-center">
              <div>
                <CalendarDays className="mx-auto h-10 w-10 text-amber-500" />
                <p className="mt-3 text-lg font-black text-slate-950">Sin noticias publicadas</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Pronto veras aqui las ultimas publicaciones de Radio Labranza FM+.</p>
              </div>
            </div>
          )}
        </div>

        <aside className="home-side-rail">
          <div className="home-ranking-panel">
            <div className="home-ranking-head">
              <span><Headphones className="h-4 w-4" /> Ranking Labranza</span>
              <Link href="/ranking">Votar</Link>
            </div>
            {topSong ? (
              <div className="home-top-song">
                <small>#1 de la semana</small>
                <strong>{topSong.title}</strong>
                <p>{topSong.artist}</p>
              </div>
            ) : null}
            <div className="home-ranking-list">
              {ranking.slice(0, 4).map((song, index) => (
                <Link href="/ranking" key={song.id}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{song.title}</strong>
                    <p>{song.artist}</p>
                  </div>
                  <small>{song.votes}</small>
                </Link>
              ))}
              {!ranking.length && (
                <div className="home-empty-dark">Pronto podras votar por tus canciones favoritas.</div>
              )}
            </div>
          </div>

          <Link className="home-community-panel" href="/comunidad">
            <span><UsersRound className="h-4 w-4" /> Comunidad</span>
            <strong>Eventos, fotos y memoria local.</strong>
            <p>Entra a las actividades y comparte registros con la comunidad.</p>
          </Link>
        </aside>
      </section>

      <section className="home-pulse-strip">
        {[
          { label: 'Cabina', value: 'En directo', icon: Radio },
          { label: 'Comunidad', value: 'Labranza conectada', icon: Sparkles },
          { label: 'Musica', value: 'Ranking activo', icon: Music2 }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label}>
              <span>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <small>{item.label}</small>
                <strong>{item.value}</strong>
              </div>
            </div>
          );
        })}
      </section>

      <section className="home-content-row">
        <div>
          <SectionHeading eyebrow="Exitos 90,2000" href="/exitos" title="Exitos 90,2000" />
          {newArticles.length ? (
            <div className="overflow-hidden rounded-xl border border-slate-900/10 bg-white/78 shadow-[0_18px_56px_rgba(15,23,42,0.07)]">
              {newArticles.slice(0, 4).map((article, index) => (
                <Link className="group grid gap-3 border-b border-slate-900/10 p-4 transition last:border-b-0 hover:bg-fuchsia-50/70 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center" href={`/exitos/${article.slug}`} key={article.slug}>
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-950 text-amber-300">
                    <Music2 className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-700">Especial {index + 1}</span>
                    <strong className="block truncate text-base font-black text-slate-950">{article.title}</strong>
                    <span className="mt-1 line-clamp-1 block text-sm font-semibold text-slate-500">{article.excerpt}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition group-hover:text-fuchsia-700">
                    Abrir <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="radio-panel rounded-lg p-6 text-sm font-semibold text-slate-600">
              Aun no hay publicaciones en Exitos 90,2000.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
