'use client';

import {
  FileText,
  LayoutDashboard,
  ListMusic,
  MapPin,
  Newspaper,
  Radio,
  Users,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Sparkles,
  PenLine,
} from 'lucide-react';
import Link from 'next/link';
import { StreamRuntimePanel } from '@/components/stream-runtime-panel';
import { useAdminAuth } from '@/lib/admin-auth';

function StatCard({ label, value, href, icon: Icon, trend }: {
  label: string; value: number; href: string; icon: React.ComponentType<{ className?: string }>; trend?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-lg border border-slate-900/10 bg-white/88 p-5 shadow-[0_18px_52px_rgba(13,38,52,0.08)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/70 hover:shadow-[0_24px_64px_rgba(13,38,52,0.13)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#020617] text-amber-300 ring-1 ring-slate-900/10">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-3xl font-black tracking-tight text-slate-950">{value}</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          {trend && (
            <span className="flex items-center gap-0.5 text-xs font-black text-amber-700">
              <ArrowUpRight className="h-3 w-3" />
              {trend}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { adminData, user } = useAdminAuth();

  const publishedArticles = adminData.articles.filter((a) => a.status === 'PUBLISHED').length;
  const draftArticles = adminData.articles.filter((a) => a.status === 'DRAFT').length;
  const communityItems = adminData.articles.filter((a) => a.category === 'Eventos' || a.category === 'Galeria').length;

  const recentArticles = [...adminData.articles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="grid gap-6 lg:gap-8">
      <div className="admin-section-hero relative overflow-hidden rounded-xl text-white">
        <div className="absolute inset-0 signal-grid opacity-[0.12]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
        <div className="relative grid gap-6 p-4 sm:p-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-black/30 sm:h-16 sm:w-16">
              <LayoutDashboard className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Sala de redaccion</p>
              <h1 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
                Panel editorial Radio Labranza FM+
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Gestiona noticias, especiales musicales, comunidad y senales desde un flujo pensado para publicar rapido y revisar con criterio de noticiero.
              </p>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-amber-300" />{publishedArticles} publicados</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-300" />{draftArticles} borradores</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-amber-300" />{communityItems} comunidad</span>
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: 'Editorial', value: `${publishedArticles} al aire`, tone: 'text-amber-200' },
              { label: 'Pendientes', value: `${draftArticles} borradores`, tone: 'text-amber-100' },
              { label: 'Comunidad', value: `${communityItems} piezas`, tone: 'text-emerald-100' },
            ].map((item) => (
              <div className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 shadow-sm" key={item.label}>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                <p className={`mt-1 text-lg font-black ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <Link href="/admin/contenido?category=Noticias#editorial-compose" className="group relative overflow-hidden rounded-xl border border-slate-900/10 bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-teal-300" />
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Accion principal</p>
          <h2 className="mt-2 text-2xl font-black">Crear publicacion</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">Abre el compositor de Noticias o Exitos con portada, bajada, cuerpo, revision y salida al sitio.</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-slate-950">
            <PenLine className="h-4 w-4" />
            Ir a redaccion
          </span>
        </Link>
        <StatCard label="Noticias" href="/admin/contenido?category=Noticias" value={adminData.articles.filter((a) => a.category === 'Noticias').length} icon={Newspaper} />
        <StatCard label="Exitos" href="/admin/contenido?category=Exitos%2090%2C2000" value={adminData.articles.filter((a) => a.category === 'Exitos 90,2000').length} icon={FileText} />
        <StatCard label="Ranking live" href="/admin/ranking" value={adminData.ranking.length} icon={ListMusic} />
        <StatCard label="Comunidad" href="/admin/comunidad" value={communityItems} icon={MapPin} />
        <StatCard label="Transmision" href="/admin/transmision" value={1} icon={Radio} />
        {user?.role === 'ADMIN' && <StatCard label="Usuarios" href="/admin/usuarios" value={adminData.users.length} icon={Users} />}
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Stream Panel */}
        <div className="admin-shell-frame overflow-hidden rounded-lg">
          <StreamRuntimePanel />
        </div>

        {/* Right Column */}
        <div className="grid gap-6 content-start">
          <div className="admin-shell-frame rounded-lg p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">Flujos de trabajo</p>
                <h2 className="mt-1 text-base font-black text-slate-950">Crear y mantener contenido</h2>
              </div>
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-4 grid gap-2">
              {[
                { label: 'Mesa editorial', href: '/admin/contenido?category=Noticias', icon: Newspaper, desc: 'Noticias, bajadas, portada y publicacion.' },
                { label: 'Exitos 90 y 2000', href: '/admin/contenido?category=Exitos%2090%2C2000', icon: FileText, desc: 'Contenido musical con lectura y portada.' },
                { label: 'Ranking live', href: '/admin/ranking', icon: ListMusic, desc: 'Canciones activas, votos y orden en vivo.' },
                { label: 'Comunidad', href: '/admin/comunidad', icon: MapPin, desc: 'Eventos, galeria y momentos locales.' },
                { label: 'Senales', href: '/admin/transmision', icon: Radio, desc: 'Estado de radio, TV y relays.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-900/10 bg-white/72 px-4 py-3 text-sm transition-all duration-200 hover:border-amber-300 hover:bg-amber-50"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#020617] text-amber-300 transition-colors duration-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 group-hover:text-amber-800">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-700" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Articles */}
          <div className="admin-shell-frame rounded-lg p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-950">
              <Clock className="h-4 w-4 text-amber-600" />
              Actividad reciente
            </h2>
            <div className="mt-4 grid gap-2">
              {recentArticles.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No hay articulos recientes</p>
              ) : (
                recentArticles.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-amber-50">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${
                      a.status === 'PUBLISHED' ? 'bg-amber-500' :
                      a.status === 'DRAFT' ? 'bg-amber-400' : 'bg-rose-400'
                    }`} />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{a.title}</p>
                    <span className="text-[11px] text-slate-400">{new Date(a.createdAt).toLocaleDateString('es-CL')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


