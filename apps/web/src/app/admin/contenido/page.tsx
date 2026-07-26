'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Archive,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Eye,
  FileText,
  Gauge,
  ImageIcon,
  Layers3,
  Megaphone,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Sparkles,
  Tags,
  Trash2,
  Type,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/admin-auth';
import { api, type Article } from '@/lib/api';
import { confirmToast } from '@/lib/confirm-toast';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { ImageUpload } from '@/components/admin/image-upload';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const categories = [
  {
    id: 'Noticias' as const,
    label: 'Noticias',
    shortLabel: 'Noticias',
    singular: 'noticia',
    icon: FileText,
    eyebrow: 'Mesa editorial',
    title: 'Noticias con ritmo de radio',
    description: 'Redacta publicaciones con portada, resumen, cuerpo, estado editorial y control de calidad antes de salir al sitio.',
    accent: 'from-amber-300 via-orange-300 to-teal-300',
    tone: 'text-amber-200',
    chip: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'Exitos 90,2000' as const,
    label: 'Exitos 90,2000',
    shortLabel: 'Exitos',
    singular: 'especial',
    icon: Sparkles,
    eyebrow: 'Musica y memoria',
    title: 'Especiales 90 y 2000',
    description: 'Prepara contenidos musicales con lectura rapida, portada fuerte y contexto para la audiencia nostalgica.',
    accent: 'from-fuchsia-300 via-amber-300 to-sky-300',
    tone: 'text-fuchsia-100',
    chip: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
  },
];

type CategoryId = (typeof categories)[number]['id'];

const statusConfig: Record<string, { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  DRAFT:    { label: 'Borrador',  badge: 'admin-badge-zinc',    icon: Eye },
  PUBLISHED: { label: 'Publicado', badge: 'admin-badge-emerald', icon: CheckCircle2 },
  ARCHIVED:  { label: 'Archivado', badge: 'admin-badge-rose',    icon: Archive },
};

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(value: string) {
  const text = stripHtml(value);
  return text ? text.split(/\s+/).length : 0;
}

function readingMinutes(value: string) {
  return Math.max(1, Math.ceil(countWords(value) / 180));
}

function getEditorialChecks(article: { title: string; excerpt: string; body: string; coverUrl?: string | null; slug?: string }) {
  const bodyWords = countWords(article.body);
  return [
    { label: 'Titulo claro', ok: article.title.trim().length >= 12, detail: 'Ideal sobre 12 caracteres' },
    { label: 'Slug listo', ok: Boolean(article.slug?.trim() || article.title.trim()), detail: 'URL limpia para publicar' },
    { label: 'Resumen util', ok: article.excerpt.trim().length >= 50, detail: 'Minimo sugerido 50 caracteres' },
    { label: 'Cuerpo suficiente', ok: bodyWords >= 80, detail: `${bodyWords} palabras` },
    { label: 'Portada asignada', ok: Boolean(article.coverUrl), detail: 'Mejora lectura y portada web' },
  ];
}

function getEditorialScore(article: { title: string; excerpt: string; body: string; coverUrl?: string | null; slug?: string }) {
  const checks = getEditorialChecks(article);
  return Math.round((checks.filter((item) => item.ok).length / checks.length) * 100);
}

function FieldHint({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-900/10 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
      <Icon className="h-3.5 w-3.5 text-amber-600/80" />
      {label}: <span className="min-w-0 truncate text-slate-950">{value}</span>
    </span>
  );
}

function EditorialChecklist({ article }: { article: { title: string; excerpt: string; body: string; coverUrl?: string | null; slug?: string } }) {
  const checks = getEditorialChecks(article);
  const score = getEditorialScore(article);

  return (
    <aside className="admin-shell-frame rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Calidad editorial</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">{score}% listo</h3>
        </div>
        <span className={`grid h-12 w-12 place-items-center rounded-lg text-sm font-black ${
          score >= 80 ? 'bg-emerald-100 text-emerald-800' : score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
        }`}>
          <Gauge className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {checks.map((item) => (
          <div className="flex items-start gap-2 rounded-md bg-white/70 p-2" key={item.label}>
            {item.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />}
            <span>
              <span className="block text-sm font-bold text-slate-800">{item.label}</span>
              <span className="block text-xs text-slate-500">{item.detail}</span>
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ArticlePreview({
  article,
  label = 'Vista contenido'
}: {
  article: Partial<Article> & { title: string; excerpt: string; body: string };
  label?: string;
}) {
  const focal = article.coverFocal ? article.coverFocal : undefined;
  const title = article.title || 'Sin titulo';
  const excerpt = article.excerpt || 'Sin resumen';
  const words = countWords(article.body);
  const minutes = readingMinutes(article.body);
  return (
    <div className="admin-article-preview">
      <div className="admin-article-preview-head">
        <span>
          <Eye className="h-3.5 w-3.5" />
          {label}
        </span>
        <small>Modelo editorial web</small>
      </div>
      <div className="admin-article-preview-hero">
        <div>
          <p>Radio Labranza FM+</p>
          <h2>{title}</h2>
          <strong>{excerpt}</strong>
          <div>
            <FieldHint icon={Type} label="Palabras" value={String(words)} />
            <FieldHint icon={CalendarClock} label="Lectura" value={`${minutes} min`} />
          </div>
        </div>
      </div>
      {article.coverUrl && (
        <div className="admin-article-preview-cover">
          <img src={article.coverUrl} alt="" style={{ objectPosition: focal ?? '50% 50%' }} />
        </div>
      )}
      <div className="admin-article-preview-body">
        <p>{excerpt}</p>
        <div
          dangerouslySetInnerHTML={{ __html: article.body || '<p>Sin contenido</p>' }}
        />
      </div>
    </div>
  );
}

export default function AdminContentPage() {
  const searchParams = useSearchParams();
  const { token, adminData, saving, setSaving, refreshContent } = useAdminAuth();
  const requestedCategory = searchParams.get('category') as CategoryId | null;
  const initialCategory = categories.some((item) => item.id === requestedCategory) ? requestedCategory! : 'Noticias';
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Article['status']>('ALL');
  const [showPreview, setShowPreview] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCover, setFormCover] = useState<string | undefined>();
  const [formFocal, setFormFocal] = useState<string | undefined>();
  const [formPublish, setFormPublish] = useState(false);

  const [editCover, setEditCover] = useState<string | null | undefined>();
  const [editFocal, setEditFocal] = useState<string | undefined>();
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editStatus, setEditStatus] = useState<string>('DRAFT');

  useEffect(() => {
    if (categories.some((item) => item.id === requestedCategory)) {
      setCategory(requestedCategory as CategoryId);
      setEditingId(null);
      setSearch('');
    }
  }, [requestedCategory]);

  const currentDraftScore = getEditorialScore({
    title: formTitle,
    slug: slugify(formSlug || formTitle),
    excerpt: formExcerpt,
    body: formBody,
    coverUrl: formCover,
  });
  const currentWords = countWords(formBody);
  const currentSlug = slugify(formSlug || formTitle);
  const activeCategory = categories.find((item) => item.id === category) ?? categories[0];
  const ActiveCategoryIcon = activeCategory.icon;
  const contentCopy =
    category === 'Noticias'
      ? {
          previewLabel: 'Vista noticia',
          editorTitle: 'Nueva noticia local',
          identityTitle: 'Identidad de la noticia',
          titleLabel: 'Titulo',
          titlePlaceholder: 'Ej: Labranza inaugura nueva actividad comunitaria',
          excerptLabel: 'Bajada / resumen',
          excerptPlaceholder: 'Resume la noticia en una frase atractiva y clara para portada.',
          bodyTitle: 'Cuerpo de la noticia',
          bodyPlaceholder: 'Cuenta que paso, donde, cuando y por que le importa a la comunidad.',
          publishLabel: 'Publicar noticia',
          draftLabel: 'Guardar borrador',
          routeHint: '/noticias/'
        }
      : {
          previewLabel: 'Vista especial musical',
          editorTitle: 'Nuevo especial musical',
          identityTitle: 'Identidad del especial',
          titleLabel: 'Tema / titular',
          titlePlaceholder: 'Ej: Los himnos 90 y 2000 que volvieron a sonar',
          excerptLabel: 'Gancho editorial',
          excerptPlaceholder: 'Describe el recuerdo, artista o momento musical que hace atractivo este especial.',
          bodyTitle: 'Historia musical',
          bodyPlaceholder: 'Agrega contexto, recuerdos, canciones clave y por que conecta con la audiencia.',
          publishLabel: 'Publicar especial',
          draftLabel: 'Guardar borrador',
          routeHint: '/exitos/'
        };
  const activeArticles = adminData.articles.filter((article) => article.category === category);
  const activePublishedCount = activeArticles.filter((article) => article.status === 'PUBLISHED').length;
  const activeDraftCount = activeArticles.filter((article) => article.status === 'DRAFT').length;
  const activeArchivedCount = activeArticles.filter((article) => article.status === 'ARCHIVED').length;

  const filteredArticles = useMemo(() => {
    const byCategory = adminData.articles.filter((a) => a.category === category && (statusFilter === 'ALL' || a.status === statusFilter));
    if (!search) return byCategory;
    const q = search.toLowerCase();
    return byCategory.filter(
      (a) => a.title.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
    );
  }, [adminData.articles, category, search, statusFilter]);

  function resetForm() {
    setFormTitle(''); setFormSlug(''); setFormExcerpt('');
    setFormBody(''); setFormCover(undefined); setFormFocal(undefined); setFormPublish(false); setShowPreview(false);
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createArticle(token, {
        title: formTitle, slug: slugify(formSlug || formTitle),
        excerpt: formExcerpt, body: formBody, category,
        coverUrl: formCover, status: formPublish ? 'PUBLISHED' : 'DRAFT',
      });
      toast.success('Contenido guardado en ' + category);
      resetForm();
      await refreshContent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setSaving(false); }
  }

  function startEdit(article: Article) {
    setEditingId(article.id);
    setEditTitle(article.title); setEditSlug(article.slug);
    setEditExcerpt(article.excerpt); setEditBody(article.body);
    setEditCover(article.coverUrl ?? undefined); setEditFocal(article.coverFocal ?? undefined); setEditStatus(article.status);
  }

  async function handleEditSave(article: Article) {
    setSaving(true);
    try {
      await api.updateArticle(token, article.id, {
        title: editTitle, slug: slugify(editSlug || editTitle),
        excerpt: editExcerpt, body: editBody,
        coverUrl: editCover === undefined ? article.coverUrl : editCover,
        status: editStatus as Article['status'],
      });
      setEditingId(null);
      toast.success('Articulo actualizado');
      await refreshContent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al editar');
    } finally { setSaving(false); }
  }

  async function runAction(action: () => Promise<unknown>, okMsg: string) {
    setSaving(true);
    try { await action(); toast.success(okMsg); await refreshContent(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid gap-6">
      <div className="admin-section-hero admin-content-hero relative overflow-hidden rounded-[1.35rem] p-4 text-white sm:p-6">
        <div className="absolute inset-0 signal-grid opacity-[0.10]" />
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${activeCategory.accent}`} />
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-28 right-24 h-56 w-56 rounded-full border border-amber-300/20" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px] xl:items-end">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${activeCategory.accent} text-slate-950 shadow-lg shadow-black/20`}>
              <ActiveCategoryIcon className="h-7 w-7" />
            </span>
            <div>
              <p className={`text-xs font-black uppercase ${activeCategory.tone}`}>{activeCategory.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">{activeCategory.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {activeCategory.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white ring-1 ring-white/12">
                  <Layers3 className="h-3.5 w-3.5 text-amber-200" />
                  {activeArticles.length} piezas en esta seccion
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white ring-1 ring-white/12">
                  <Wand2 className="h-3.5 w-3.5 text-amber-200" />
                  {currentDraftScore}% calidad del borrador
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="admin-metric-dark rounded-lg px-4 py-3">
              <p className="text-2xl font-black text-emerald-200">{activePublishedCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-normal text-emerald-200/70">Publicados</p>
            </div>
            <div className="admin-metric-dark rounded-lg px-4 py-3">
              <p className="text-2xl font-black text-zinc-300">{activeDraftCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-normal text-zinc-400">Borradores</p>
            </div>
            <div className="admin-metric-dark rounded-lg px-4 py-3">
              <p className="text-2xl font-black text-rose-200">{activeArchivedCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-normal text-rose-200/70">Archivados</p>
            </div>
            <div className="admin-metric-dark rounded-lg px-4 py-3">
              <p className="text-2xl font-black text-amber-200">{filteredArticles.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-normal text-amber-200/70">Filtrados</p>
            </div>
          </div>
        </div>
      </div>

      <section className="admin-shell-frame overflow-hidden rounded-[1.15rem]">
        <div className="grid gap-4 border-b border-slate-900/10 bg-white/72 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Sala editorial</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Noticias y especiales listos para salir al aire</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Selecciona mesa, revisa estado y entra directo al compositor. La logica es de noticiero: portada, bajada, cuerpo, revision y publicacion.</p>
          </div>
          <Button asChild className="h-11 rounded-lg bg-slate-950 px-4 text-sm font-black text-amber-200 hover:bg-slate-900">
            <a href="#editorial-compose">
              <Plus className="h-4 w-4" />
              Escribir ahora
            </a>
          </Button>
        </div>

        <div className="grid gap-3 border-b border-slate-900/10 bg-slate-950 p-2 sm:grid-cols-2">
          {categories.map((cat) => {
            const active = category === cat.id;
            const count = adminData.articles.filter((a) => a.category === cat.id).length;
            return (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setEditingId(null); setSearch(''); }}
              className={`group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                active ? 'bg-white text-slate-950 shadow-lg shadow-black/20' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.10] hover:text-white'
              }`}
              type="button"
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${active ? 'bg-amber-400 text-slate-950' : 'bg-slate-950 text-amber-300 ring-1 ring-white/10'}`}>
                <cat.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black">{cat.label}</span>
                <span className={`mt-0.5 block truncate text-xs font-semibold ${active ? 'text-slate-500' : 'text-slate-500 group-hover:text-slate-300'}`}>{cat.eyebrow}</span>
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${active ? 'bg-slate-950 text-amber-200' : 'bg-white/10 text-slate-300'}`}>{count}</span>
            </button>
            );
          })}
        </div>

        <div className="grid gap-4 bg-slate-50/70 p-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL' as const, label: 'Todos', colors: { active: 'border-slate-700 bg-slate-900 text-white hover:bg-slate-800', idle: 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800' } },
              { id: 'DRAFT' as const, label: 'Borradores', colors: { active: 'border-zinc-400 bg-zinc-200 text-zinc-800', idle: 'border-zinc-300 bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700' } },
              { id: 'PUBLISHED' as const, label: 'Publicados', colors: { active: 'border-emerald-500 bg-emerald-100 text-emerald-800', idle: 'border-emerald-300 bg-emerald-50 text-emerald-600 hover:border-emerald-400 hover:text-emerald-700' } },
              { id: 'ARCHIVED' as const, label: 'Archivados', colors: { active: 'border-rose-400 bg-rose-100 text-rose-800', idle: 'border-rose-300 bg-rose-50 text-rose-500 hover:border-rose-400 hover:text-rose-700' } },
            ].map((item) => (
              <button
                className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${
                  statusFilter === item.id ? item.colors.active : item.colors.idle
                }`}
                key={item.id}
                onClick={() => setStatusFilter(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="admin-input pl-9"
              placeholder="Buscar por titulo, slug o resumen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-[1.1rem] border border-slate-900/10 bg-white/78 p-3 shadow-[0_18px_52px_rgba(15,23,42,0.06)] sm:grid-cols-4">
        {[
          { label: '1. Portada', value: formCover ? 'Imagen lista' : 'Falta imagen', icon: ImageIcon },
          { label: '2. Bajada', value: formExcerpt ? 'Resumen listo' : 'Sin bajada', icon: Type },
          { label: '3. Cuerpo', value: `${currentWords} palabras`, icon: FileText },
          { label: '4. Calidad', value: `${currentDraftScore}% listo`, icon: Gauge },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3" key={item.label}>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-amber-300">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{item.label}</span>
                <strong className="text-sm text-slate-950">{item.value}</strong>
              </span>
            </div>
          );
        })}
      </section>

      <section className="admin-ops-strip grid gap-3 rounded-[1.1rem] p-3 sm:grid-cols-3">
        {[
          { label: 'Publicados', value: `${activePublishedCount}/${activeArticles.length || 0}`, icon: CheckCircle2, tone: 'admin-ops-ok' },
          { label: 'Borradores', value: String(activeDraftCount), icon: ClipboardCheck, tone: 'admin-ops-wait' },
          { label: 'Archivados', value: String(activeArchivedCount), icon: Archive, tone: 'admin-ops-archive' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div className={`admin-ops-card ${item.tone}`} key={item.label}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[11px] font-black uppercase text-slate-500">{item.label}</span>
                <span className="block text-xl font-black text-slate-950">{item.value}</span>
              </span>
            </div>
          );
        })}
      </section>

      {/* Articles List */}
      <div className="admin-editorial-list overflow-hidden rounded-[1.25rem]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/10 bg-white/72 px-4 py-4 sm:px-6">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase text-amber-700">
              <Megaphone className="h-3.5 w-3.5" />
              Gestion editorial
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-black text-slate-950">
              {category}
              <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-amber-200">{filteredArticles.length} articulos</span>
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
            CRUD operativo
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center p-6 text-sm text-zinc-400">
            {search ? 'No se encontraron articulos.' : 'No hay contenido en esta categoria.'}
          </div>
        ) : (
          <div className="admin-content-table-wrap">
            <div className="admin-content-table-head">
              <span>#</span>
              <span>Articulo</span>
              <span>Estado</span>
              <span>Slug</span>
              <span>Lectura</span>
              <span>Publicado</span>
              <span>Acciones</span>
            </div>
            {filteredArticles.map((article, index) => {
              const st = statusConfig[article.status] ?? statusConfig.DRAFT;
              const StIcon = st.icon;
              return (
                <div className="admin-article-row admin-content-table-row group" key={article.id}>
                  <div className="admin-row-index">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{article.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500">{article.excerpt || 'Sin resumen'}</p>
                  </div>
                  <span className={`admin-badge ${st.badge}`}>
                    <StIcon className="mr-1 inline h-3 w-3" />
                    {st.label}
                  </span>
                  <span className="admin-table-chip">
                    <Tags className="h-3 w-3" />
                    <span className="truncate">{article.slug}</span>
                  </span>
                  <span className="admin-table-chip">
                    <Type className="h-3 w-3" />
                    {countWords(article.body)} palabras
                  </span>
                  <span className="admin-table-chip">
                    <Send className="h-3 w-3" />
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                  </span>
                  <div className="admin-row-actions">
                    {article.status === 'DRAFT' && (
                      <Button aria-label="Publicar articulo" title="Publicar" className="admin-action-publish" disabled={saving} onClick={() => runAction(() => api.updateArticle(token, article.id, { status: 'PUBLISHED' }), 'Articulo publicado!')} type="button" variant="outline">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {article.status === 'PUBLISHED' && (
                      <Button aria-label="Archivar articulo" title="Archivar" className="admin-action-archive" disabled={saving} onClick={() => runAction(() => api.updateArticle(token, article.id, { status: 'ARCHIVED' }), 'Articulo archivado.')} type="button" variant="outline">
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {article.status === 'ARCHIVED' && (
                      <Button aria-label="Restaurar articulo" title="Restaurar" className="admin-action-restore" disabled={saving} onClick={() => runAction(() => api.updateArticle(token, article.id, { status: 'DRAFT' }), 'Restaurado a borrador.')} type="button" variant="outline">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      aria-label={editingId === article.id ? 'Cerrar editor' : 'Editar articulo'}
                      title={editingId === article.id ? 'Cerrar' : 'Editar'}
                      className={editingId === article.id ? 'admin-action-edit-active' : 'admin-action-edit'}
                      disabled={saving}
                      onClick={() => editingId === article.id ? setEditingId(null) : startEdit(article)}
                      type="button"
                      variant="outline"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      aria-label="Eliminar articulo"
                      title="Eliminar"
                      className="admin-action-delete"
                      disabled={saving}
                      onClick={() => confirmToast({
                        title: 'Eliminar articulo',
                        description: article.title,
                        confirmLabel: 'Eliminar',
                        onConfirm: () => runAction(() => api.deleteArticle(token, article.id), 'Articulo eliminado.'),
                      })}
                      type="button"
                      variant="outline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Edit Panel */}
                  {editingId === article.id && (
                    <div className="admin-content-edit-panel border-t border-slate-900/10 bg-gradient-to-b from-amber-50/70 to-white/80 px-4 py-5 sm:px-6 sm:py-6">
                      <div className="mb-5 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950">
                          <Pencil className="h-4 w-4 text-amber-300" />
                        </span>
                        <span className="text-sm font-black text-slate-950">Editando: {article.title}</span>
                      </div>
                      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                        <div className="grid gap-5">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                              <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Titulo</label>
                              <input className="admin-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titulo" required />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Slug</label>
                              <input className="admin-input" value={editSlug} onChange={(e) => setEditSlug(e.target.value)} placeholder="Slug" />
                            </div>
                          </div>
                          <ImageUpload
                            token={token}
                            value={editCover}
                            onChange={(value) => setEditCover(value ?? null)}
                            focalPoint={editFocal}
                            onFocalChange={setEditFocal}
                            label="Imagen de portada"
                          />
                          <div className="grid gap-2">
                            <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Resumen editorial</label>
                          <textarea
                            className="admin-input min-h-20 resize-y leading-relaxed"
                            value={editExcerpt}
                            onChange={(e) => setEditExcerpt(e.target.value)}
                            placeholder="Resumen del articulo"
                            required
                          />
                          </div>
                          <div>
                            <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Contenido</p>
                            <RichTextEditor value={editBody} onChange={setEditBody} placeholder="Escribe el contenido aqui..." minHeight={250} />
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-900/10 bg-white/80 p-4">
                            <div className="grid gap-1">
                              <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Estado</span>
                            <select className="admin-input w-auto bg-white text-sm" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                              <option value="DRAFT">Borrador</option>
                              <option value="PUBLISHED">Publicado</option>
                              <option value="ARCHIVED">Archivado</option>
                            </select>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button className="admin-action-cancel transition-all" disabled={saving} onClick={() => setEditingId(null)} type="button" variant="outline">Cancelar</Button>
                              <Button className="admin-action-save transition-all" disabled={saving} type="button" onClick={() => handleEditSave(article)}>
                                <Save className="h-4 w-4" />
                                {saving ? 'Guardando...' : 'Guardar cambios'}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="hidden lg:block">
                          <div className="sticky top-8 grid gap-4">
                          <EditorialChecklist
                            article={{
                              title: editTitle || article.title,
                              slug: editSlug || article.slug,
                              excerpt: editExcerpt || article.excerpt,
                              body: editBody || article.body,
                              coverUrl: editCover === undefined ? article.coverUrl : editCover,
                            }}
                          />
                          <ArticlePreview
                            article={{
                              title: editTitle || article.title,
                              excerpt: editExcerpt || article.excerpt,
                              body: editBody || article.body,
                              coverUrl: editCover === undefined ? article.coverUrl ?? undefined : editCover ?? undefined,
                              coverFocal: editFocal ?? article.coverFocal ?? undefined,
                            }}
                            label={contentCopy.previewLabel}
                          />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Article Form */}
      <div className="admin-shell-frame overflow-hidden rounded-xl" id="editorial-compose">
        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-white/10 bg-[#020617] px-4 py-3 text-white sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-400 text-slate-950 shadow-sm shadow-amber-950/30">
              <Plus className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase leading-none tracking-[0.14em] text-amber-300">Redaccion</p>
              <h2 className="mt-1 text-sm font-black leading-none tracking-tight sm:text-base">
                {contentCopy.editorTitle}
              </h2>
            </div>
          </div>
          <Button
            variant="outline"
            className="h-8 shrink-0 rounded-md border-amber-400 bg-amber-400 px-3 text-xs font-black text-slate-950 shadow-sm shadow-amber-950/25 transition-all hover:border-amber-300 hover:bg-amber-300 hover:text-slate-950"
            onClick={() => setShowPreview(!showPreview)}
            type="button"
           
          >
            <Eye className="h-3.5 w-3.5" />
            {showPreview ? 'Editor' : 'Previsualizar'}
          </Button>
        </div>

        {showPreview ? (
          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_360px]">
            <ArticlePreview
              article={{
                title: formTitle || 'Sin titulo',
                excerpt: formExcerpt || 'Sin resumen',
                body: formBody || '<p>Sin contenido</p>',
                coverUrl: formCover,
                coverFocal: formFocal,
              }}
              label={contentCopy.previewLabel}
            />
            <EditorialChecklist
              article={{
                title: formTitle,
                slug: currentSlug,
                excerpt: formExcerpt,
                body: formBody,
                coverUrl: formCover,
              }}
            />
          </div>
        ) : (
          <form className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]" onSubmit={handleCreate}>
            <div className="grid gap-5">
              <section className="grid gap-4 rounded-lg border border-slate-900/10 bg-white/70 p-4">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">{contentCopy.identityTitle}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-[1.35fr_0.85fr]">
                  <div className="grid gap-2">
                    <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{contentCopy.titleLabel}</label>
                    <input className="admin-input text-base font-bold" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} name="title" placeholder={contentCopy.titlePlaceholder} required />
                  </div>
                  <div className="grid gap-2">
                    <label className="flex items-center justify-between gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      Slug
                      {currentSlug && (
                        <button
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-amber-100"
                          onClick={() => void navigator.clipboard?.writeText(currentSlug)}
                          type="button"
                        >
                          <Copy className="h-3 w-3" />
                          Copiar
                        </button>
                      )}
                    </label>
                    <input className="admin-input" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} name="slug" placeholder={currentSlug || 'slug-opcional'} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{contentCopy.excerptLabel}</label>
                  <textarea
                    className="admin-input min-h-24 resize-y leading-relaxed"
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    name="excerpt"
                    placeholder={contentCopy.excerptPlaceholder}
                    required
                  />
                </div>
              </section>

              <section className="rounded-lg border border-slate-900/10 bg-white/70 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">Portada y encuadre</h3>
                </div>
                <ImageUpload token={token} value={formCover} onChange={setFormCover} focalPoint={formFocal} onFocalChange={setFormFocal} label="Imagen principal" />
              </section>

              <section className="rounded-lg border border-slate-900/10 bg-white/70 p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">{contentCopy.bodyTitle}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FieldHint icon={Type} label="Palabras" value={String(currentWords)} />
                    <FieldHint icon={CalendarClock} label="Lectura" value={`${readingMinutes(formBody)} min`} />
                  </div>
                </div>
                <RichTextEditor value={formBody} onChange={setFormBody} placeholder={contentCopy.bodyPlaceholder} minHeight={360} />
              </section>
            </div>

            <aside className="grid content-start gap-4">
              <EditorialChecklist
                article={{
                  title: formTitle,
                  slug: currentSlug,
                  excerpt: formExcerpt,
                  body: formBody,
                  coverUrl: formCover,
                }}
              />
              <section className="rounded-lg border border-slate-900/10 bg-white/75 p-4 shadow-[0_14px_42px_rgba(15,23,42,0.07)] backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Publicacion</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Salida al sitio</h3>
                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    checked={formPublish}
                    onChange={(e) => setFormPublish(e.target.checked)}
                  />
                  Publicar inmediatamente
                </label>
                <div className="mt-4 grid gap-2 rounded-lg bg-slate-950 p-4 text-sm text-slate-300">
                  <span className="font-black text-white">{formPublish ? 'Se publicara ahora' : 'Se guardara como borrador'}</span>
                  <span>Categoria: {category}</span>
                  <span>Ruta publica: {contentCopy.routeHint}{currentSlug || 'slug-pendiente'}</span>
                </div>
                <div className="mt-4 grid gap-2">
                  <Button
                    className="admin-action-save h-12 transition-all"
                    disabled={saving}
                    type="submit"
                  >
                    {formPublish ? <Send className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Guardando...' : formPublish ? contentCopy.publishLabel : contentCopy.draftLabel}
                  </Button>
                  <Button className="admin-action-cancel" onClick={resetForm} type="button" variant="outline">
                    Limpiar editor
                  </Button>
                </div>
              </section>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}


