'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Link2,
  Mail,
  MessageCircle,
  Newspaper,
  Radio,
  Share2,
  Tags,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, type Article } from '@/lib/api';
import { EditorialCover } from '@/components/editorial-cover';

type ArticleDetailViewProps = {
  expectedCategory: 'Noticias' | 'Exitos 90,2000';
  backHref: string;
  backLabel: string;
  notFoundTitle: string;
};

function publicArticlePath(article: Pick<Article, 'category' | 'slug'>) {
  return article.category === 'Exitos 90,2000' ? `/exitos/${article.slug}` : `/noticias/${article.slug}`;
}

function safeImage(value?: string | null) {
  if (!value) return null;
  if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) return value;
  return null;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readingMinutes(value: string) {
  const words = stripHtml(value).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function buildTags(article: Article) {
  const source = `${article.category} ${article.title} ${article.excerpt}`;
  const stopWords = new Set(['para', 'con', 'del', 'los', 'las', 'una', 'uno', 'que', 'por', 'sus', 'mas', 'este', 'esta', 'desde', 'como']);
  const words = source
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !stopWords.has(word.toLowerCase()));

  return Array.from(new Set([article.category, ...words])).slice(0, 9);
}

function formatDate(value?: string | null) {
  if (!value) return 'Publicado ahora';
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ArticleDetailView({ expectedCategory, backHref, backLabel, notFoundTitle }: ArticleDetailViewProps) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null | 'loading'>('loading');
  const [related, setRelated] = useState<Article[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!slug) return;

    setArticle('loading');
    setNotFound(false);

    api.articleBySlug(slug)
      .then((result) => {
        if (!result || result.status !== 'PUBLISHED') {
          setNotFound(true);
          setArticle(null);
          return;
        }

        if (result.category !== expectedCategory) {
          router.replace(publicArticlePath(result));
          return;
        }

        setArticle(result);
        api.articles(result.category)
          .then((items) => setRelated(items.filter((item) => item.slug !== result.slug).slice(0, 5)))
          .catch(() => setRelated([]));
      })
      .catch(() => {
        setNotFound(true);
        setArticle(null);
      });
  }, [expectedCategory, router, slug]);

  async function copyCurrentLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Enlace copiado', {
      description: 'Listo para compartir esta publicacion.',
    });
  }

  if (notFound) {
    return (
      <article className="article-page-shell">
        <Button asChild className="w-fit border-slate-900/10 bg-white text-slate-950 hover:bg-amber-50" variant="outline">
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
        <div className="article-empty-state">
          <Newspaper className="mx-auto h-10 w-10 text-amber-500" />
          <h1>{notFoundTitle}</h1>
          <p>Esta publicacion no existe o no esta disponible.</p>
        </div>
      </article>
    );
  }

  if (!article || article === 'loading') {
    return (
      <article className="article-page-shell">
        <div className="article-loading">
          <span />
          <p>Cargando publicacion...</p>
        </div>
      </article>
    );
  }

  const coverUrl = safeImage(article.coverUrl);
  const minutes = readingMinutes(article.body || article.excerpt);
  const tags = buildTags(article);
  const date = formatDate(article.publishedAt);
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`${article.title} ${shareUrl}`)}`;
  const articleText = stripHtml(article.body || article.excerpt);
  const isHits = article.category === 'Exitos 90,2000';
  const articleBodyHtml = article.body || `<p>${escapeHtml(article.excerpt)}</p>`;

  return (
    <article className={`article-page-shell ${isHits ? 'is-hit-article' : ''}`}>
      <Button asChild className="article-back-button" variant="outline">
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </Button>

      <header className="article-hero">
        <div className="article-hero-copy">
          <div className="article-kicker-row">
            <span className="article-category-pill">{article.category}</span>
            <span><CalendarDays className="h-4 w-4" /> {date}</span>
            <span><Clock3 className="h-4 w-4" /> {minutes} min lectura</span>
          </div>
          <h1>{article.title}</h1>
          <p>{article.excerpt}</p>
          <div className="article-byline">
            <span><UserRound className="h-4 w-4" /> Radio Hit 90 y 2000</span>
            <span><Radio className="h-4 w-4" /> {isHits ? 'Archivo musical' : 'Redaccion'}</span>
          </div>
        </div>

        <aside className="article-share-card">
          <p>Compartir</p>
          <div>
            <Button className="article-share-button" onClick={() => void copyCurrentLink()} type="button" variant="outline">
              <Link2 className="h-4 w-4" />
              Copiar
            </Button>
            <Button asChild className="article-share-button" variant="outline">
              <a href={whatsappShare} rel="noreferrer" target="_blank">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>
          <small><Share2 className="h-3.5 w-3.5" /> Enlace listo para compartir.</small>
        </aside>
      </header>

      <figure className="article-cover-frame">
        <div className="article-cover-media">
          {coverUrl ? (
            <img alt={article.title} src={coverUrl} />
          ) : (
            <EditorialCover category={article.category} title={article.title} featured />
          )}
        </div>
        <figcaption>{article.title}</figcaption>
      </figure>

      <section className="article-reading-layout">
        <main className="article-body-card">
          <p className="article-lead">{article.excerpt}</p>
          <div
            className="article-prose"
            dangerouslySetInnerHTML={{ __html: articleBodyHtml }}
          />
        </main>

        <aside className="article-side-rail">
          <section className="article-side-card">
            <div className="article-side-title">
              <Tags className="h-4 w-4" />
              <h2>Etiquetas</h2>
            </div>
            <div className="article-tags">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </section>

          <section className="article-contact-card">
            <Mail className="h-5 w-5" />
            <h2>Contacto editorial</h2>
            <p>Envia antecedentes, sugerencias o material para nuevas publicaciones.</p>
            <a href="mailto:contacto@radiolabranza.cl">contacto@radiolabranza.cl</a>
          </section>

          <section className="article-side-card article-summary-card">
            <h2>Resumen rapido</h2>
            <p>{articleText.slice(0, 210)}{articleText.length > 210 ? '...' : ''}</p>
          </section>
        </aside>
      </section>

      <section className="article-related-section">
        <div className="article-related-head">
          <span>Relacionadas</span>
          <h2>Seguir leyendo</h2>
        </div>
        {related.length ? (
          <div className="article-related-grid">
            {related.slice(0, 3).map((item) => {
              const relatedCover = safeImage(item.coverUrl);
              return (
                <Link className="article-related-card" href={publicArticlePath(item)} key={item.id}>
                  <span className="article-related-image">
                    {relatedCover ? <img alt="" src={relatedCover} /> : <EditorialCover category={item.category} title={item.title} />}
                  </span>
                  <small>{item.category}</small>
                  <strong>{item.title}</strong>
                  <span>Leer <ArrowUpRight className="h-3.5 w-3.5" /></span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="article-related-empty">Aun no hay publicaciones relacionadas.</div>
        )}
      </section>
    </article>
  );
}
