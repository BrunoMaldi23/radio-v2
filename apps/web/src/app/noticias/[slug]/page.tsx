import { ArticleDetailView } from '@/components/article-detail-view';
import { api } from '@/lib/api';
import { redirect } from 'next/navigation';

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await api.articleBySlug(slug).catch(() => null);

  if (article?.category === 'Exitos 90,2000') {
    redirect(`/exitos/${article.slug}`);
  }

  return (
    <ArticleDetailView
      backHref="/noticias"
      backLabel="Volver a noticias"
      expectedCategory="Noticias"
      notFoundTitle="Noticia no encontrada"
    />
  );
}
