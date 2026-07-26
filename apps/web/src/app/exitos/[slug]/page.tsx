import { ArticleDetailView } from '@/components/article-detail-view';
import { api } from '@/lib/api';
import { redirect } from 'next/navigation';

export default async function HitArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await api.articleBySlug(slug).catch(() => null);

  if (article && article.category !== 'Exitos 90,2000') {
    redirect(`/noticias/${article.slug}`);
  }

  return (
    <ArticleDetailView
      backHref="/exitos"
      backLabel="Volver a Exitos"
      expectedCategory="Exitos 90,2000"
      notFoundTitle="Especial no encontrado"
    />
  );
}
