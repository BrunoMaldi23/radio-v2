import type { Article, Program } from '@/lib/api';

export const fallbackImage = '/logo-home.jpeg';

function safeMediaUrl(value?: string | null) {
  if (!value) {
    return fallbackImage;
  }

  if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return fallbackImage;
}

function safeArticleMediaUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return null;
}

export function mapArticle(article: Article) {
  return {
    slug: article.slug,
    category: article.category,
    title: article.title,
    excerpt: article.excerpt,
    imageUrl: safeArticleMediaUrl(article.coverUrl),
    date: article.publishedAt
      ? new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(new Date(article.publishedAt))
      : 'Ahora'
  };
}

export function mapProgram(program: Program) {
  return {
    id: program.id,
    slug: program.slug,
    name: program.name,
    host: program.host,
    schedule: program.schedule,
    imageUrl: safeMediaUrl(program.imageUrl)
  };
}
