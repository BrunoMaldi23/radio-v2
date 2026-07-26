import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateArticleCommentDto } from './dto/create-article-comment.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

function sanitizeHtml(html: string): string {
  const { JSDOM } = require('jsdom');
  const createDOMPurify = require('dompurify');
  const window = new JSDOM('').window;
  const purify = createDOMPurify(window as unknown as Window);
  return purify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'hr', 'div', 'span', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sub', 'sup'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'width', 'height', 'align'],
    ALLOW_DATA_ATTR: false,
  });
}

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway
  ) {}

  findPublished(category?: string) {
    return this.prisma.article.findMany({
      where: { status: ContentStatus.PUBLISHED, ...(category ? { category } : {}) },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
    });
  }

  findAll() {
    return this.prisma.article.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  findBySlug(slug: string) {
    return this.prisma.article.findUnique({ where: { slug } });
  }

  findEventGallery(eventId: number) {
    return this.prisma.article.findMany({
      where: {
        eventId,
        category: 'Galeria',
        status: ContentStatus.PUBLISHED
      },
      include: {
        _count: { select: { comments: true } }
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
    }).then((items) =>
      items.map(({ _count, ...item }) => ({
        ...item,
        commentsCount: _count.comments
      }))
    );
  }

  attend(id: number) {
    return this.prisma.article.update({
      where: { id },
      data: { attendees: { increment: 1 } }
    });
  }

  like(id: number) {
    return this.prisma.article.update({
      where: { id },
      data: { likes: { increment: 1 } }
    });
  }

  comments(articleId: number) {
    return this.prisma.articleComment.findMany({
      where: { articleId, article: { status: ContentStatus.PUBLISHED } },
      orderBy: { createdAt: 'asc' },
      take: 60
    });
  }

  async createComment(articleId: number, dto: CreateArticleCommentDto) {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, status: ContentStatus.PUBLISHED },
      select: { id: true }
    });
    if (!article) {
      throw new BadRequestException('La imagen no existe o no esta disponible.');
    }

    return this.prisma.articleComment.create({
      data: {
        articleId,
        body: dto.body.trim().slice(0, 420),
        author: dto.author?.trim().slice(0, 80) || null
      }
    });
  }

  async create(dto: CreateArticleDto) {
    const slug = await this.nextAvailableSlug(dto.slug || dto.title);
    const eventId = await this.resolveEventId(dto.eventId, dto.category);
    const article = await this.prisma.article.create({
      data: {
        ...dto,
        body: sanitizeHtml(dto.body),
        slug,
        eventId,
        publishedAt: dto.status === ContentStatus.PUBLISHED ? new Date() : undefined
      }
    });

    if (article.status === ContentStatus.PUBLISHED) {
      this.realtime.emitContentPublished(article);
    }

    return article;
  }

  async createCommunitySubmission(dto: CreateArticleDto) {
    const category = ['Eventos', 'Galeria'].includes(dto.category) ? dto.category : 'Galeria';
    const slug = await this.nextAvailableSlug(dto.slug || dto.title);
    const eventId = await this.resolveEventId(dto.eventId, category);

    return this.prisma.article.create({
      data: {
        ...dto,
        body: sanitizeHtml(dto.body),
        category,
        slug,
        eventId,
        status: ContentStatus.DRAFT,
        publishedAt: undefined
      }
    });
  }

  async createEventGallerySubmission(eventId: number, dto: CreateArticleDto) {
    await this.ensurePublishedEvent(eventId);
    const slug = await this.nextAvailableSlug(dto.slug || dto.title);

    return this.prisma.article.create({
      data: {
        ...dto,
        body: sanitizeHtml(dto.body || dto.excerpt),
        category: 'Galeria',
        slug,
        eventId,
        status: ContentStatus.DRAFT,
        publishedAt: undefined
      }
    });
  }

  async update(id: number, dto: UpdateArticleDto) {
    const current = await this.prisma.article.findUnique({ where: { id }, select: { status: true, category: true } });
    const shouldSetPublishedAt = dto.status === ContentStatus.PUBLISHED && current?.status !== ContentStatus.PUBLISHED;
    const eventId = await this.resolveEventId(dto.eventId, dto.category ?? current?.category);

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...dto,
        body: dto.body ? sanitizeHtml(dto.body) : undefined,
        eventId,
        publishedAt: shouldSetPublishedAt ? new Date() : undefined
      }
    });

    if (article.status === ContentStatus.PUBLISHED) {
      this.realtime.emitContentPublished(article);
    }

    return article;
  }

  remove(id: number) {
    return this.prisma.article.delete({ where: { id } });
  }

  private async nextAvailableSlug(value: string) {
    const base = this.slugify(value);
    let slug = base;
    let suffix = 2;

    while (await this.prisma.article.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private slugify(value: string) {
    const slug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || `contenido-${Date.now()}`;
  }

  private async resolveEventId(eventId: number | null | undefined, category?: string) {
    if (category !== 'Galeria') return null;
    if (eventId === null) return null;
    if (eventId === undefined) return undefined;
    await this.ensurePublishedEvent(eventId, false);
    return eventId;
  }

  private async ensurePublishedEvent(eventId: number, requirePublished = true) {
    const event = await this.prisma.article.findFirst({
      where: {
        id: eventId,
        category: 'Eventos',
        ...(requirePublished ? { status: ContentStatus.PUBLISHED } : {})
      },
      select: { id: true }
    });
    if (!event) {
      throw new BadRequestException('El evento asociado no existe o no esta disponible.');
    }
    return event;
  }
}
