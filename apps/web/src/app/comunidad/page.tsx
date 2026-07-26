import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Camera, Heart, MapPin, UsersRound } from 'lucide-react';
import { PublicPageHero } from '@/components/public-page-hero';
import { api, type Article } from '@/lib/api';

function imageOf(item: Article | undefined | null) {
  return item?.coverUrl ?? null;
}

function formatDate(value: string | null) {
  if (!value) return 'Muy pronto';
  return new Date(value).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sortByFreshness(items: Article[]) {
  return [...items].sort((a, b) => {
    const aDate = new Date(a.publishedAt ?? a.updatedAt).getTime();
    const bDate = new Date(b.publishedAt ?? b.updatedAt).getTime();
    return bDate - aDate;
  });
}

function EventRow({ event, index }: { event: Article; index: number }) {
  return (
    <Link className="group grid gap-4 border-b border-slate-900/10 bg-white/72 p-4 transition last:border-b-0 hover:bg-amber-50/75 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:items-center sm:p-5" href={`/comunidad/eventos/${event.slug}`}>
      <span className="relative grid h-24 w-full place-items-center overflow-hidden rounded-lg bg-slate-950 sm:w-24">
        {imageOf(event) ? (
          <img className="h-full w-full object-cover transition duration-300 group-hover:scale-105" src={imageOf(event)!} alt="" />
        ) : (
          <Camera className="h-8 w-8 text-amber-200" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-1 text-[10px] font-black text-slate-950">
          {String(index + 1).padStart(2, '0')}
        </span>
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-amber-700">
          <span>{formatDate(event.publishedAt)}</span>
          <span>
            <MapPin className="h-3.5 w-3.5" />
            Labranza
          </span>
        </span>
        <strong className="mt-2 block text-xl font-black leading-tight text-slate-950">{event.title}</strong>
        <span className="mt-2 line-clamp-2 block text-sm leading-6 text-slate-600">{event.excerpt}</span>
      </span>
      <span className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-black text-slate-600">
            <UsersRound className="h-3.5 w-3.5" />
            {event.attendees ?? 0}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-black text-slate-600">
            <Heart className="h-3.5 w-3.5" />
            {event.likes ?? 0}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-amber-200 transition group-hover:bg-amber-400 group-hover:text-slate-950">
          Ver evento
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </span>
    </Link>
  );
}

export default async function ComunidadPage() {
  const events = await api.articles('Eventos').then(sortByFreshness).catch(() => []);
  const stats = {
    events: events.length,
    attendees: events.reduce((sum, item) => sum + (item.attendees ?? 0), 0),
    reactions: events.reduce((sum, item) => sum + (item.likes ?? 0), 0),
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-8">
      <PublicPageHero
        eyebrow="Comunidad"
        icon={CalendarDays}
        title="Eventos"
        description="Cartelera local de actividades publicadas por Radio Labranza FM+. Entra a cada evento para ver su detalle y mural de imagenes."
        action={
          <div className="community-index-stats">
            <span><strong>{stats.events}</strong> eventos</span>
            <span><strong>{stats.attendees}</strong> asistencias</span>
            <span><strong>{stats.reactions}</strong> reacciones</span>
          </div>
        }
      />

      {events.length ? (
        <section className="overflow-hidden rounded-xl border border-slate-900/10 bg-white/80 shadow-[0_22px_64px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid gap-3 border-b border-slate-900/10 bg-white/70 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Agenda local</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Eventos de la comunidad</h2>
            </div>
            <p className="text-sm font-semibold leading-6 text-slate-500">Formato de agenda para elegir rapido un evento y entrar a su detalle, asistencia y mural fotografico.</p>
          </div>
          {events.map((event, index) => (
            <EventRow event={event} index={index} key={event.id} />
          ))}
        </section>
      ) : (
        <div className="radio-panel rounded-lg p-6 text-sm font-semibold text-slate-600">
          Aun no hay eventos publicados. Cuando el admin cree uno, aparecera aqui como card de comunidad.
        </div>
      )}
    </main>
  );
}
