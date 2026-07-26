'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, CalendarDays, Camera, Heart, ImagePlus, Images, Loader2, MapPin, UsersRound } from 'lucide-react';
import { AttendButton } from '@/components/community-actions';
import { GalleryWithLightbox } from '@/components/gallery-lightbox';
import { api, type Article } from '@/lib/api';

function formatDate(value: string | null) {
  if (!value) return 'Publicado por la radio';
  return new Date(value).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
}

function imageOf(item: Article | null | undefined) {
  return item?.coverUrl ?? null;
}

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, '').trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Article | null | 'loading'>(null);
  const [gallery, setGallery] = useState<Article[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.articleBySlug(slug)
      .then(async (article) => {
        if (!article || article.category !== 'Eventos' || article.status !== 'PUBLISHED') {
          setNotFound(true);
          return;
        }
        setEvent(article);
        setGallery(await api.eventGallery(article.id).catch(() => []));
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  const muralItems = useMemo(
    () =>
      gallery.map((item) => ({
        id: item.id,
        title: item.title,
        excerpt: item.excerpt,
        imageUrl: imageOf(item),
        likes: item.likes ?? 0,
        commentsCount: item.commentsCount ?? 0,
        slug: item.slug,
      })),
    [gallery]
  );

  async function handleMuralFile(changeEvent: ChangeEvent<HTMLInputElement>) {
    if (!event || event === 'loading') return;

    const input = changeEvent.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      toast.error('Sube una imagen para el mural.');
      return;
    }

    setSubmitting(true);
    try {
      const uploaded = await api.uploadPublicImage(file);
      const stamp = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
      const title = `Foto de ${event.title}`;
      const excerpt = `Aporte fotografico enviado por la comunidad el ${stamp}.`;
      await api.createEventGallerySubmission(event.id, {
        title,
        slug: slugify(`${event.slug}-${file.name}-${Date.now()}`),
        excerpt,
        body: excerpt,
        coverUrl: uploaded.url,
      });
      input.value = '';
      toast.success('Imagen recibida. La radio la revisara antes de publicarla.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la imagen.');
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <main className="mx-auto grid max-w-6xl gap-6 p-6">
        <Link className="community-back-link community-back-link-compact" href="/comunidad">
          <ArrowLeft className="h-4 w-4" />
          Volver a comunidad
        </Link>
        <div className="grid min-h-72 place-items-center">
          <div className="text-center">
            <h1 className="text-4xl font-black text-slate-950">Evento no encontrado</h1>
            <p className="mt-3 text-slate-500">Este evento no existe o no esta disponible.</p>
          </div>
        </div>
      </main>
    );
  }

  if (event === null || event === 'loading') {
    return (
      <main className="mx-auto grid max-w-6xl gap-6 p-6">
        <Link className="community-back-link community-back-link-compact" href="/comunidad">
          <ArrowLeft className="h-4 w-4" />
          Volver a comunidad
        </Link>
        <div className="grid min-h-72 place-items-center">
          <h1 className="text-2xl font-black text-slate-950">Cargando...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="community-event-page mx-auto grid max-w-6xl gap-8">
      <Link className="community-back-link community-back-link-compact" href="/comunidad">
        <ArrowLeft className="h-4 w-4" />
        Volver a eventos
      </Link>

      <article className="community-event-profile">
        <section className="community-event-profile-hero">
          {event.coverUrl ? (
            <img src={event.coverUrl} alt="" />
          ) : (
            <div className="community-event-profile-empty">
              <Camera className="h-12 w-12" />
            </div>
          )}
          <div className="community-event-profile-shade" />
          <div className="community-event-profile-copy">
            <span className="community-cover-kicker">
              <CalendarDays className="h-4 w-4" />
              Evento comunidad
            </span>
            <h1>{event.title}</h1>
            <p>{event.excerpt}</p>
            <div className="community-event-profile-actions">
              <AttendButton articleId={event.id} initialCount={event.attendees ?? 0} />
              <span className="community-detail-chip">
                <Heart className="h-4 w-4" />
                {event.likes ?? 0} reacciones
              </span>
            </div>
          </div>
        </section>

        <section className="community-event-profile-body">
          <div className="community-event-story">
            <span>Ficha del evento</span>
            <h2>{event.excerpt}</h2>
            <p>{plainText(event.body || event.excerpt)}</p>
          </div>
          <aside className="community-event-profile-aside">
            <div>
              <CalendarDays className="h-5 w-5" />
              <span>Fecha</span>
              <strong>{formatDate(event.publishedAt)}</strong>
            </div>
            <div>
              <MapPin className="h-5 w-5" />
              <span>Lugar</span>
              <strong>Labranza</strong>
            </div>
            <div>
              <UsersRound className="h-5 w-5" />
              <span>Participacion</span>
              <strong>{event.attendees ?? 0} asistentes</strong>
            </div>
          </aside>
        </section>
      </article>

      <section className="community-event-mural">
        <div className="community-editorial-head">
          <div>
            <span>Mural del evento</span>
            <h2>Imagenes y registros</h2>
          </div>
          <p>Este espacio agrupa las imagenes que el admin y los participantes asocian a este evento.</p>
        </div>

        {muralItems.length ? (
          <GalleryWithLightbox items={muralItems} />
        ) : (
          <div className="community-mural-empty">
            <Images className="h-9 w-9" />
            <div>
              <h3>Aun no hay imagenes para este evento</h3>
              <p>Cuando el admin publique fotos relacionadas, apareceran aqui como mural del evento.</p>
            </div>
          </div>
        )}
      </section>

      <section className="community-public-upload">
        <div>
          <span>Participa en el mural</span>
          <h2>Sube una imagen de este evento</h2>
          <p>El aporte queda asociado automaticamente a este evento y pasa por revision antes de publicarse.</p>
        </div>
        <label className={`community-public-file community-public-file-button${submitting ? ' is-busy' : ''}`}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <span>{submitting ? 'Subiendo foto...' : 'Subir foto'}</span>
          <input accept="image/jpeg,image/png,image/webp,image/gif" disabled={submitting} name="imageFile" onChange={handleMuralFile} type="file" />
        </label>
      </section>
    </main>
  );
}
