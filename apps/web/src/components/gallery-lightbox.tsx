'use client';

import { Camera, Download, Eye, Heart, ImageIcon, MessageCircle, Send, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, type ArticleComment } from '@/lib/api';

type GalleryItem = {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  likes: number;
  commentsCount: number;
  slug: string;
};

export function GalleryWithLightbox({ items }: { items: GalleryItem[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [likesMap, setLikesMap] = useState<Record<number, number>>({});
  const [commentsMap, setCommentsMap] = useState<Record<number, ArticleComment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [likedSet, setLikedSet] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set();
    return new Set(
      items.filter((i) => window.localStorage.getItem(`radio-community-like-${i.id}`) === '1').map((i) => i.id)
    );
  });
  const backdropRef = useRef<HTMLDivElement>(null);

  const current = items[index];

  const downloadName = useMemo(
    () => (current?.title || 'galeria').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg',
    [current]
  );

  const openAt = useCallback((i: number) => {
    setIndex(i);
    setOpen(true);
    setCommentDraft('');
  }, []);

  const go = useCallback(
    (delta: number) => setIndex((prev) => (prev + delta + items.length) % items.length),
    [items.length]
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close, go]);

  useEffect(() => {
    if (!open || !current || commentsMap[current.id]) return;
    setCommentsLoading(true);
    api.articleComments(current.id)
      .then((comments) => setCommentsMap((prev) => ({ ...prev, [current.id]: comments })))
      .catch(() => setCommentsMap((prev) => ({ ...prev, [current.id]: [] })))
      .finally(() => setCommentsLoading(false));
  }, [open, current, commentsMap]);

  async function handleLike(id: number) {
    if (likedSet.has(id)) return;
    setLikedSet((prev) => new Set(prev).add(id));
    setLikesMap((prev) => ({ ...prev, [id]: (prev[id] ?? items.find((i) => i.id === id)?.likes ?? 0) + 1 }));
    window.localStorage.setItem(`radio-community-like-${id}`, '1');
    try {
      const updated = await api.likeArticle(id);
      setLikesMap((prev) => ({ ...prev, [id]: updated.likes ?? 0 }));
    } catch (err) {
      setLikedSet((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      setLikesMap((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) }));
      window.localStorage.removeItem(`radio-community-like-${id}`);
    }
  }

  const getLikes = (item: GalleryItem) => likesMap[item.id] ?? item.likes;
  const getComments = (item: GalleryItem) => commentsMap[item.id] ?? [];
  const getCommentsCount = (item: GalleryItem) => commentsMap[item.id]?.length ?? item.commentsCount;

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current) return;
    const text = commentDraft.trim();
    if (!text) return;
    setCommentDraft('');
    const temp: ArticleComment = {
      id: -Date.now(),
      articleId: current.id,
      body: text,
      author: null,
      createdAt: new Date().toISOString()
    };
    setCommentsMap((prev) => ({ ...prev, [current.id]: [...(prev[current.id] ?? []), temp] }));
    try {
      const saved = await api.createArticleComment(current.id, { body: text });
      setCommentsMap((prev) => ({
        ...prev,
        [current.id]: (prev[current.id] ?? []).map((comment) => (comment.id === temp.id ? saved : comment))
      }));
    } catch {
      setCommentsMap((prev) => ({
        ...prev,
        [current.id]: (prev[current.id] ?? []).filter((comment) => comment.id !== temp.id)
      }));
      setCommentDraft(text);
    }
  }

  return (
    <>
      <div className="community-gallery-grid">
        {items.map((item, i) => (
          <article className="community-gallery-card" key={item.id}>
            <button className="block w-full cursor-pointer text-left" onClick={() => openAt(i)} type="button">
              {item.imageUrl ? (
                <img alt="" className="w-full" src={item.imageUrl} style={{ height: 170, objectFit: 'cover' }} />
              ) : (
                <div className="flex h-[170px] items-center justify-center bg-stone-100 sm:h-[200px]">
                  <Camera className="h-8 w-8 text-stone-300" />
                </div>
              )}
              <div className="community-gallery-card-body">
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
              </div>
            </button>
            <div className="flex items-center gap-2 px-[0.85rem] pb-[0.75rem] sm:px-[1rem] sm:pb-[0.85rem]">
              <button
                className="community-view-btn"
                onClick={() => openAt(i)}
                type="button"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Ver</span>
              </button>
              <button
                className={`community-like-btn ${likedSet.has(item.id) ? 'is-liked' : ''}`}
                disabled={likedSet.has(item.id)}
                onClick={() => handleLike(item.id)}
                type="button"
              >
                <Heart className="h-3.5 w-3.5" />
                <span>{getLikes(item)}</span>
              </button>
              <a className="community-download-btn" download={(item.title || 'galeria').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg'} href={item.imageUrl ?? ''}>
                <Download className="h-3.5 w-3.5" />
                <span>Descargar</span>
              </a>
              <button className="community-comment-btn" onClick={() => openAt(i)} type="button">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{getCommentsCount(item)}</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {open && current && (
        <div
          ref={backdropRef}
          className="community-lightbox-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#050816]/94 p-3 backdrop-blur-md sm:p-5"
          onClick={(e) => { if (e.target === backdropRef.current) close(); }}
        >
          <button
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            onClick={close}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          {items.length > 1 && (
            <>
              <button
                aria-label="Imagen anterior"
                className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-5 sm:h-12 sm:w-12"
                onClick={() => go(-1)}
                type="button"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                aria-label="Imagen siguiente"
                className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-5 sm:h-12 sm:w-12"
                onClick={() => go(1)}
                type="button"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <section className="community-lightbox-shell">
            <div className="community-lightbox-stage">
              {current.imageUrl ? (
                <img alt={current.title} src={current.imageUrl} />
              ) : (
                <div className="community-lightbox-empty">
                  <Camera className="h-10 w-10" />
                  <span>Imagen no disponible</span>
                </div>
              )}
            </div>
            <aside className="community-lightbox-info">
              <span className="community-lightbox-kicker">
                <ImageIcon className="h-3.5 w-3.5" />
                Galeria comunidad
              </span>
              <h2>{current.title}</h2>
              {current.excerpt && <p>{current.excerpt}</p>}
              <div className="community-lightbox-count">
                <span>{index + 1}</span>
                de {items.length} imagenes
              </div>
              <div className="community-lightbox-actions">
                <button
                  className={`community-like-btn ${likedSet.has(current.id) ? 'is-liked' : ''}`}
                  disabled={likedSet.has(current.id)}
                  onClick={() => handleLike(current.id)}
                  type="button"
                >
                  <Heart className="h-3.5 w-3.5" />
                  <span>{getLikes(current)}</span>
                </button>
                <a className="community-download-btn" download={downloadName} href={current.imageUrl ?? ''}>
                  <Download className="h-3.5 w-3.5" />
                  <span>Descargar</span>
                </a>
              </div>
              <div className="community-lightbox-comments">
                <div className="community-lightbox-comments-head">
                  <MessageCircle className="h-4 w-4" />
                  <strong>Comentarios</strong>
                  <span>{getCommentsCount(current)}</span>
                </div>
                <div className="community-lightbox-comment-list">
                  {commentsLoading ? (
                    <p className="is-empty">Cargando comentarios...</p>
                  ) : getComments(current).length ? (
                    getComments(current).map((comment) => <p key={comment.id}>{comment.body}</p>)
                  ) : (
                    <p className="is-empty">Se el primero en comentar esta foto.</p>
                  )}
                </div>
                <form className="community-lightbox-comment-form" onSubmit={handleCommentSubmit}>
                  <input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Escribe un comentario breve" />
                  <button aria-label="Enviar comentario" type="submit">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </aside>
          </section>
        </div>
      )}
    </>
  );
}
