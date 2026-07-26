'use client';

import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Archive,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Heart,
  ImageIcon,
  Images,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/admin/image-upload';
import { useAdminAuth } from '@/lib/admin-auth';
import { api, type Article } from '@/lib/api';
import { confirmToast } from '@/lib/confirm-toast';

type CommunityForm = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverUrl?: string | null;
  eventId?: number | null;
};

const statusConfig: Record<Article['status'], { label: string; badge: string }> = {
  DRAFT: { label: 'Pendiente', badge: 'admin-badge-zinc' },
  SCHEDULED: { label: 'Programado', badge: 'admin-badge-violet' },
  PUBLISHED: { label: 'Publicado', badge: 'admin-badge-emerald' },
  ARCHIVED: { label: 'Archivado', badge: 'admin-badge-rose' },
};

function emptyForm(): CommunityForm {
  return { title: '', slug: '', excerpt: '', body: '', coverUrl: undefined, eventId: undefined };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function dateLabel(value: string | null | undefined) {
  if (!value) return 'Sin publicar';
  return new Date(value).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function imageOf(item: Article | null | undefined) {
  return item?.coverUrl ?? null;
}

function byFreshness(items: Article[]) {
  return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export default function AdminComunidadPage() {
  const { token, adminData, saving, setSaving, refreshContent } = useAdminAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState(emptyForm());
  const [muralForm, setMuralForm] = useState(emptyForm());
  const [editForm, setEditForm] = useState(emptyForm());
  const [editStatus, setEditStatus] = useState<Article['status']>('PUBLISHED');

  const communityItems = useMemo(
    () => adminData.articles.filter((article) => article.category === 'Eventos' || article.category === 'Galeria'),
    [adminData.articles]
  );
  const events = byFreshness(communityItems.filter((article) => article.category === 'Eventos'));
  const gallery = byFreshness(communityItems.filter((article) => article.category === 'Galeria'));
  const pendingGallery = gallery.filter((item) => item.status === 'DRAFT');
  const totalAttendees = events.reduce((total, item) => total + (item.attendees ?? 0), 0);

  const galleryByEvent = useMemo(() => {
    return gallery.reduce<Record<number, number>>((acc, item) => {
      if (item.eventId) acc[item.eventId] = (acc[item.eventId] ?? 0) + 1;
      return acc;
    }, {});
  }, [gallery]);

  const eventById = useMemo(() => {
    return events.reduce<Record<number, Article>>((acc, event) => {
      acc[event.id] = event;
      return acc;
    }, {});
  }, [events]);

  function setEventValue(key: keyof CommunityForm, value: string | number | null | undefined) {
    setEventForm((current) => ({ ...current, [key]: value }));
  }

  function setMuralValue(key: keyof CommunityForm, value: string | number | null | undefined) {
    setMuralForm((current) => ({ ...current, [key]: value }));
  }

  function setEditValue(key: keyof CommunityForm, value: string | number | null | undefined) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(article: Article) {
    setEditingId(article.id);
    setEditForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      body: article.body,
      coverUrl: article.coverUrl ?? undefined,
      eventId: article.eventId ?? undefined,
    });
    setEditStatus(article.status);
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createArticle(token, {
        title: eventForm.title,
        slug: slugify(eventForm.slug || eventForm.title),
        excerpt: eventForm.excerpt,
        body: eventForm.body || eventForm.excerpt,
        category: 'Eventos',
        coverUrl: eventForm.coverUrl ?? undefined,
        eventId: null,
        status: 'PUBLISHED',
      });
      toast.success('Evento publicado.');
      setEventForm(emptyForm());
      await refreshContent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar el evento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateMural(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!muralForm.eventId) {
      toast.error('Selecciona el evento al que pertenece esta imagen.');
      return;
    }
    setSaving(true);
    try {
      await api.createArticle(token, {
        title: muralForm.title,
        slug: slugify(muralForm.slug || muralForm.title),
        excerpt: muralForm.excerpt,
        body: muralForm.body || muralForm.excerpt,
        category: 'Galeria',
        coverUrl: muralForm.coverUrl ?? undefined,
        eventId: muralForm.eventId,
        status: 'PUBLISHED',
      });
      toast.success('Imagen agregada al mural del evento.');
      setMuralForm(emptyForm());
      await refreshContent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo agregar la imagen.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave(article: Article) {
    if (article.category === 'Galeria' && !editForm.eventId) {
      toast.error('Selecciona el evento al que pertenece esta imagen.');
      return;
    }
    setSaving(true);
    try {
      await api.updateArticle(token, article.id, {
        title: editForm.title,
        slug: slugify(editForm.slug || editForm.title),
        excerpt: editForm.excerpt,
        body: editForm.body || editForm.excerpt,
        coverUrl: editForm.coverUrl === undefined ? article.coverUrl ?? undefined : editForm.coverUrl ?? undefined,
        eventId: article.category === 'Galeria' ? editForm.eventId ?? null : null,
        status: editStatus,
      });
      setEditingId(null);
      toast.success('Registro actualizado.');
      await refreshContent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: () => Promise<unknown>, success: string) {
    setSaving(true);
    try {
      await action();
      toast.success(success);
      await refreshContent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la accion.');
    } finally {
      setSaving(false);
    }
  }

  async function removeArticle(article: Article) {
    confirmToast({
      title: 'Eliminar registro de comunidad',
      description: article.title,
      confirmLabel: 'Eliminar',
      onConfirm: () => runAction(() => api.deleteArticle(token, article.id), 'Registro eliminado.'),
    });
  }

  function renderCard(item: Article) {
    const status = statusConfig[item.status] ?? statusConfig.DRAFT;
    const hasImage = imageOf(item);
    const isEvent = item.category === 'Eventos';
    const linkedEvent = item.eventId ? eventById[item.eventId] : undefined;

    return (
      <article className="community-admin-card" key={item.id}>
        <div className="community-admin-card-image">
          {hasImage ? <img src={hasImage} alt="" /> : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-2 text-slate-300">
                {isEvent ? <CalendarDays className="h-8 w-8" /> : <Images className="h-8 w-8" />}
                <span className="text-xs font-bold uppercase tracking-wider">Sin imagen</span>
              </div>
            </div>
          )}
          <div />
          <span className={`admin-badge ${status.badge} community-admin-card-badge`}>{status.label}</span>
        </div>
        <div className="community-admin-card-body">
          <h3>{item.title}</h3>
          <p>{item.excerpt}</p>
          <div className="community-admin-card-meta">
            <span>/{item.slug}</span>
            <span>{dateLabel(item.publishedAt ?? item.updatedAt)}</span>
            {isEvent ? <span>{item.attendees ?? 0} asistentes</span> : <span>{item.likes ?? 0} likes</span>}
            {isEvent && <span>{galleryByEvent[item.id] ?? 0} imagenes</span>}
            {!isEvent && <span className={linkedEvent ? 'is-linked' : 'is-unlinked'}>{linkedEvent ? linkedEvent.title : 'Sin evento'}</span>}
          </div>
        </div>
        <div className="community-admin-card-actions">
          {item.status === 'DRAFT' && (
            <Button aria-label="Publicar" className="admin-action-publish" disabled={saving} onClick={() => runAction(() => api.updateArticle(token, item.id, { status: 'PUBLISHED' }), 'Publicado.')} type="button" variant="outline">
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          {item.status === 'PUBLISHED' && (
            <Button aria-label="Archivar" className="admin-action-archive" disabled={saving} onClick={() => runAction(() => api.updateArticle(token, item.id, { status: 'ARCHIVED' }), 'Archivado.')} type="button" variant="outline">
              <Archive className="h-4 w-4" />
            </Button>
          )}
          {item.status === 'ARCHIVED' && (
            <Button aria-label="Restaurar" className="admin-action-restore" disabled={saving} onClick={() => runAction(() => api.updateArticle(token, item.id, { status: 'DRAFT' }), 'Restaurado.')} type="button" variant="outline">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button aria-label="Editar" className={editingId === item.id ? 'admin-action-edit-active' : 'admin-action-edit'} disabled={saving} onClick={() => (editingId === item.id ? setEditingId(null) : startEdit(item))} type="button" variant="outline">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button aria-label="Eliminar" className="admin-action-delete" disabled={saving} onClick={() => removeArticle(item)} type="button" variant="outline">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {editingId === item.id && (
          <form className="community-admin-edit" onSubmit={(event) => { event.preventDefault(); void handleEditSave(item); }}>
            <input className="admin-input" placeholder="Titulo" required value={editForm.title} onChange={(event) => setEditValue('title', event.target.value)} />
            <input className="admin-input" placeholder="Slug" value={editForm.slug} onChange={(event) => setEditValue('slug', event.target.value)} />
            <textarea className="admin-input min-h-20 resize-y md:col-span-2" placeholder="Resumen publico" required value={editForm.excerpt} onChange={(event) => setEditValue('excerpt', event.target.value)} />
            <textarea className="admin-input min-h-24 resize-y md:col-span-2" placeholder="Detalle o creditos" value={editForm.body} onChange={(event) => setEditValue('body', event.target.value)} />
            <div className="md:col-span-2">
              <ImageUpload token={token} value={editForm.coverUrl} onChange={(value) => setEditValue('coverUrl', value ?? null)} label="Imagen" />
            </div>
            {!isEvent && (
              <select className="admin-input bg-white" required value={editForm.eventId ?? ''} onChange={(event) => setEditValue('eventId', event.target.value ? Number(event.target.value) : null)}>
                <option value="">Selecciona un evento</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
            )}
            <select className="admin-input bg-white" value={editStatus} onChange={(event) => setEditStatus(event.target.value as Article['status'])}>
              <option value="PUBLISHED">Publicado</option>
              <option value="DRAFT">Pendiente</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
            <div className="flex justify-end gap-2">
              <Button className="admin-action-cancel" disabled={saving} onClick={() => setEditingId(null)} type="button" variant="outline">Cancelar</Button>
              <Button className="admin-action-save" disabled={saving} type="submit">
                <Save className="h-4 w-4" />
                Guardar
              </Button>
            </div>
          </form>
        )}
      </article>
    );
  }

  function renderApprovalCard(item: Article) {
    const linkedEvent = item.eventId ? eventById[item.eventId] : undefined;
    const hasImage = imageOf(item);

    return (
      <article className="community-admin-approval-card" key={item.id}>
        <div className="community-admin-approval-image">
          {hasImage ? <img src={hasImage} alt="" /> : <Images className="h-8 w-8" />}
        </div>
        <div className="community-admin-approval-body">
          <span>En revision</span>
          <h3>{item.title}</h3>
          <p>{item.excerpt}</p>
          <small>{linkedEvent ? `Evento: ${linkedEvent.title}` : 'Sin evento asociado'}</small>
        </div>
        <div className="community-admin-approval-actions">
          <Button className="admin-action-save" disabled={saving} onClick={() => runAction(() => api.updateArticle(token, item.id, { status: 'PUBLISHED' }), 'Imagen aprobada y publicada.')} type="button">
            <CheckCircle2 className="h-4 w-4" />
            Aprobar
          </Button>
          <Button className="admin-action-delete" disabled={saving} onClick={() => removeArticle(item)} type="button" variant="outline">
            <Trash2 className="h-4 w-4" />
            Rechazar
          </Button>
        </div>
      </article>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="community-admin-hero">
        <div className="community-admin-hero-copy">
          <span>
            <Sparkles className="h-4 w-4" />
            Comunidad admin
          </span>
          <h1>Eventos primero. Murales dentro de cada actividad.</h1>
          <p>Publica la agenda territorial y revisa las imagenes colaborativas sin cambiar de modulo. Cada foto vive asociada a un evento concreto.</p>
        </div>
        <div className="community-admin-stats">
          <div>
            <CalendarCheck2 className="h-5 w-5" />
            <strong>{events.length}</strong>
            <span>eventos</span>
          </div>
          <div>
            <ImageIcon className="h-5 w-5" />
            <strong>{gallery.length}</strong>
            <span>imagenes mural</span>
          </div>
          <div>
            <UsersRound className="h-5 w-5" />
            <strong>{totalAttendees}</strong>
            <span>asistencias</span>
          </div>
          <div>
            <Heart className="h-5 w-5" />
            <strong>{pendingGallery.length}</strong>
            <span>pendientes</span>
          </div>
        </div>
      </section>

      <section className="community-admin-workspace">
        {pendingGallery.length > 0 && (
          <section className="community-admin-approval-panel">
            <div className="community-admin-approval-head">
              <div>
                <span>
                  <ShieldCheck className="h-4 w-4" />
                  Cola de aprobacion
                </span>
                <h2>Imagenes por aprobar</h2>
                <p>Fotos enviadas por participantes. Al aprobarlas aparecen automaticamente en el mural del evento.</p>
              </div>
              <strong>{pendingGallery.length}</strong>
            </div>
            <div className="community-admin-approval-list">
              {pendingGallery.map(renderApprovalCard)}
            </div>
          </section>
        )}

        <div className="community-admin-flow">
          <div>
            <strong>1</strong>
            <span>Crea el evento que vera la comunidad.</span>
          </div>
          <div>
            <strong>2</strong>
            <span>Sube imagenes al mural de ese evento.</span>
          </div>
          <div>
            <strong>3</strong>
            <span>Aprueba aportes enviados por participantes.</span>
          </div>
        </div>

        <div className="community-admin-create-grid">
          <div className="community-create-card community-create-card-primary">
            <div className="community-create-head">
              <span className="community-create-badge">
                <CalendarDays className="h-4 w-4" />
                Publicar evento
              </span>
              <span className="community-create-head-hint">
                <Sparkles className="h-3 w-3" />
                Publicacion inmediata
              </span>
            </div>
            <form className="community-create-body" onSubmit={handleCreateEvent}>
              <div className="community-create-fields">
                <label className="community-create-label">
                  <span className="community-create-label-text"><Pencil className="h-3 w-3" />Titulo</span>
                  <input className="admin-input community-create-input" required value={eventForm.title} onChange={(event) => setEventValue('title', event.target.value)} placeholder="Ej: Tarde familiar en Labranza" />
                </label>
                <label className="community-create-label">
                  <span className="community-create-label-text"><span className="font-mono text-[0.6rem]">/</span>Slug</span>
                  <input className="admin-input community-create-input" value={eventForm.slug} onChange={(event) => setEventValue('slug', event.target.value)} placeholder={slugify(eventForm.title) || 'slug-opcional'} />
                </label>
                <label className="community-create-label">
                  <span className="community-create-label-text"><span className="font-bold text-xs">&#x2192;</span>Descripcion</span>
                  <textarea className="admin-input community-create-textarea" required value={eventForm.excerpt} onChange={(event) => setEventValue('excerpt', event.target.value)} placeholder="Texto breve que vera el publico en la card del evento." />
                </label>
              </div>
              <div className="community-create-media">
                <span className="community-create-label-text">Imagen del evento</span>
                <ImageUpload token={token} value={eventForm.coverUrl} onChange={(value) => setEventValue('coverUrl', value)} label="Subir imagen del evento" />
                <label className="community-create-label">
                  <span className="community-create-label-text">Detalle del evento</span>
                  <textarea className="admin-input community-create-textarea-sm" value={eventForm.body} onChange={(event) => setEventValue('body', event.target.value)} placeholder="Informacion adicional para el detalle publico." />
                </label>
              </div>
              <div className="community-create-footer">
                <div className="flex gap-2">
                  <button className="community-create-clear" onClick={() => setEventForm(emptyForm())} type="button">Limpiar</button>
                  <button className="community-create-submit" disabled={saving} type="submit">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {saving ? 'Publicando...' : 'Publicar evento'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="community-create-card community-create-card-compact">
            <div className="community-create-head">
              <span className="community-create-badge">
                <ImageIcon className="h-4 w-4" />
                Agregar al mural
              </span>
            </div>
            <form className="community-create-body community-create-body-compact" onSubmit={handleCreateMural}>
              <div className="community-create-media">
                <label className="community-create-label">
                  <span className="community-create-label-text"><CalendarDays className="h-3 w-3" />Evento</span>
                  <select className="admin-input community-create-input bg-white" required value={muralForm.eventId ?? ''} onChange={(event) => setMuralValue('eventId', event.target.value ? Number(event.target.value) : null)}>
                    <option value="">Selecciona un evento</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </label>
                <label className="community-create-label">
                  <span className="community-create-label-text">Titulo / credito</span>
                  <input className="admin-input community-create-input" required value={muralForm.title} onChange={(event) => setMuralValue('title', event.target.value)} placeholder="Ej: Publico cantando frente al escenario" />
                </label>
                <label className="community-create-label">
                  <span className="community-create-label-text">Contexto</span>
                  <textarea className="admin-input community-create-textarea-sm" required value={muralForm.excerpt} onChange={(event) => setMuralValue('excerpt', event.target.value)} placeholder="Momento capturado, autor o descripcion breve." />
                </label>
                <ImageUpload token={token} value={muralForm.coverUrl} onChange={(value) => setMuralValue('coverUrl', value)} label="Subir imagen al mural" />
              </div>
              <div className="community-create-footer">
                <button className="community-create-submit" disabled={saving} type="submit">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Agregar imagen
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="community-admin-main">
        <div className="community-admin-list-head">
          <div>
            <p>Agenda territorial</p>
            <h2>Eventos publicados</h2>
          </div>
          <span>{events.length} eventos</span>
        </div>
        <div className="community-admin-list">
          {events.length === 0 ? <div className="community-admin-empty">No hay eventos todavia. Crea el primero desde el formulario superior.</div> : events.map(renderCard)}
        </div>
      </section>

      <section className="community-admin-main community-admin-review">
        <div className="community-admin-list-head">
          <div>
            <p>Revision visual</p>
            <h2>{pendingGallery.length > 0 ? 'Aportes pendientes' : 'Mural comunitario'}</h2>
          </div>
          <span>{gallery.length} imagenes</span>
        </div>
        <div className="community-admin-list community-admin-gallery-list">
          {(pendingGallery.length > 0 ? pendingGallery : gallery).length === 0 ? (
            <div className="community-admin-empty">Todavia no hay imagenes de mural. Agrega una desde el bloque superior o espera aportes del publico.</div>
          ) : (
            (pendingGallery.length > 0 ? pendingGallery : gallery).map(renderCard)
          )}
        </div>
      </section>
    </div>
  );
}
