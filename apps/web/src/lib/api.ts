export type Role = 'ADMIN' | 'OPERATOR' | 'EDITOR' | 'STUDENT' | 'TEACHER';
export type ResourceType = 'BOOK' | 'HARDWARE';
export type BookingStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  isPenalized: boolean;
  penaltyEndDate: string | null;
};

export type UserPayload = {
  name: string;
  email: string;
  password?: string;
  role: Role;
  isActive?: boolean;
  isPenalized?: boolean;
  penaltyEndDate?: string | null;
};

export type AuditLog = {
  id: number;
  actorId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  description: string;
  createdAt: string;
  actor: Pick<User, 'id' | 'name' | 'email'> | null;
};

export type Space = {
  id: number;
  name: string;
  capacity: number;
  features: string;
  isActive: boolean;
};

export type Resource = {
  id: number;
  title: string;
  type: ResourceType;
  uniqueCode: string;
  isActive: boolean;
};

export type Booking = {
  id: number;
  userId: number;
  spaceId: number | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  user: Pick<User, 'id' | 'name' | 'email'>;
  space: Space | null;
  details: Array<{ id: number; resourceId: number; resource: Resource }>;
};

export type RankingTrack = {
  id: number;
  title: string;
  artist: string;
  artworkUrl: string | null;
  votes: number;
  isActive: boolean;
};

export type ChatMessage = {
  id: number;
  room: string;
  author: string;
  message: string;
  isHidden: boolean;
  createdAt: string;
};

export type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  coverUrl: string | null;
  coverFocal?: string | null;
  eventId?: number | null;
  likes?: number;
  attendees?: number;
  commentsCount?: number;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArticleComment = {
  id: number;
  articleId: number;
  body: string;
  author: string | null;
  createdAt: string;
};

export type Program = {
  id: number;
  slug: string;
  name: string;
  host: string;
  description: string;
  schedule: string;
  imageUrl: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
};

export type Frequency = {
  id: number;
  city: string;
  dial: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type IngestProfiles = {
  audio: Record<string, string | number>;
  video: Record<string, string | number>;
};

export type StreamingRuntimeStatus = {
  mediamtx: {
    ok: boolean;
    paths: {
      items?: Array<{
        name: string;
        ready: boolean;
        source: { type: string; id: string } | null;
        tracks?: string[];
        tracks2?: Array<{ codec: string; codecProps?: Record<string, unknown> }>;
        readers?: Array<{ type: string; id: string }>;
        bytesReceived?: number;
        bytesSent?: number;
      }>;
    } | null;
    error: string | null;
  };
  hls: { ok: boolean; status: number };
  icecast: { ok: boolean; status: number };
};

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
export const API_URL = configuredApiUrl || '/api';

function getRequestBaseUrl() {
  if (typeof window !== 'undefined') {
    return API_URL;
  }

  // Server-side: prefer going through Vercel rewrites (via deployment URL) to avoid
  // direct nip.io DNS issues. Falls back to API_PROXY_URL (set on Vercel dashboard),
  // then to configuredApiUrl or /api.
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}/api`;
  }

  return configuredApiUrl || process.env.API_PROXY_URL || API_URL;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${getRequestBaseUrl()}${path}`, {
    cache: 'no-store',
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? 'No se pudo completar la operación.');
  }

  return response.json() as Promise<T>;
}

async function uploadRequest<T>(path: string, formData: FormData, token: string | undefined) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    cache: 'no-store',
    credentials: 'same-origin',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? 'No se pudo subir el archivo.');
  }

  return response.json() as Promise<T>;
}

export const api = {
  hasUsers() {
    return request<{ hasUsers: boolean }>('/auth/has-users');
  },
  bootstrapAdmin(payload: { name: string; email: string; password: string }) {
    return request<{ accessToken: string; user: User }>('/auth/bootstrap-admin', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  login(email: string, password: string) {
    return request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  me(token?: string) {
    return request<{ user: User; accessToken: string }>('/auth/me', {}, token);
  },
  logout() {
    return request<{ ok: boolean }>('/auth/logout', { method: 'POST' });
  },
  spaces(token: string | undefined) {
    return request<Space[]>('/spaces', {}, token);
  },
  resources(token: string | undefined) {
    return request<Resource[]>('/resources', {}, token);
  },
  bookings(token: string | undefined) {
    return request<Booking[]>('/bookings', {}, token);
  },
  users(token: string | undefined) {
    return request<User[]>('/users', {}, token);
  },
  audit(token: string | undefined) {
    return request<AuditLog[]>('/audit', {}, token);
  },
  createBooking(
    token: string | undefined,
    payload: { spaceId?: number; startTime: string; endTime: string; resourceIds: number[] }
  ) {
    return request<Booking>(
      '/bookings',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      token
    );
  },
  updateBooking(
    token: string | undefined,
    id: number,
    payload: { spaceId?: number; startTime: string; endTime: string; resourceIds: number[] }
  ) {
    return request<Booking>(
      `/bookings/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      },
      token
    );
  },
  activateBooking(token: string | undefined, id: number) {
    return request<Booking>(`/bookings/${id}/activate`, { method: 'PATCH' }, token);
  },
  cancelBooking(token: string | undefined, id: number) {
    return request<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' }, token);
  },
  completeBooking(token: string | undefined, id: number) {
    return request<Booking>(`/bookings/${id}/complete`, { method: 'PATCH', body: JSON.stringify({}) }, token);
  },
  markNoShow(token: string | undefined, id: number) {
    return request<Booking>(`/bookings/${id}/no-show`, { method: 'PATCH' }, token);
  },
  createSpace(token: string | undefined, payload: Omit<Space, 'id'>) {
    return request<Space>('/spaces', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  updateSpace(token: string | undefined, id: number, payload: Partial<Omit<Space, 'id'>>) {
    return request<Space>(`/spaces/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
  },
  createResource(token: string | undefined, payload: Omit<Resource, 'id'>) {
    return request<Resource>('/resources', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  updateResource(token: string | undefined, id: number, payload: Partial<Omit<Resource, 'id'>>) {
    return request<Resource>(`/resources/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
  },
  createUser(token: string | undefined, payload: UserPayload & { password: string }) {
    return request<User>('/users', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  updateUser(token: string | undefined, id: number, payload: Partial<UserPayload>) {
    return request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
  },
  clearPenalty(token: string | undefined, id: number) {
    return request<User>(`/users/${id}/clear-penalty`, { method: 'PATCH' }, token);
  },
  ranking() {
    return request<RankingTrack[]>('/ranking');
  },
  adminRanking(token: string | undefined) {
    return request<RankingTrack[]>('/ranking/admin', {}, token);
  },
  vote(trackId: number) {
    return request<RankingTrack>(`/ranking/${trackId}/vote`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  },
  chatMessages(room = 'tv') {
    return request<ChatMessage[]>(`/chat/messages?room=${encodeURIComponent(room)}`);
  },
  sendChatMessage(payload: { author: string; message: string; room?: string }) {
    return request<ChatMessage>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  ingestProfiles() {
    return request<IngestProfiles>('/streaming/ingest-profiles');
  },
  streamingRuntimeStatus() {
    return request<StreamingRuntimeStatus>('/streaming/runtime-status');
  },
  articles(category?: string) {
    return request<Article[]>(`/articles${category ? `?category=${encodeURIComponent(category)}` : ''}`);
  },
  adminArticles(token: string | undefined) {
    return request<Article[]>('/articles/admin', {}, token);
  },
  articleBySlug(slug: string) {
    return request<Article>(`/articles/${encodeURIComponent(slug)}`);
  },
  eventGallery(eventId: number) {
    return request<Article[]>(`/articles/${eventId}/gallery`);
  },
  attendArticle(id: number) {
    return request<Article>(`/articles/${id}/attend`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  },
  likeArticle(id: number) {
    return request<Article>(`/articles/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  },
  articleComments(id: number) {
    return request<ArticleComment[]>(`/articles/${id}/comments`);
  },
  createArticleComment(id: number, payload: { body: string; author?: string }) {
    return request<ArticleComment>(`/articles/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  programsPublic() {
    return request<Program[]>('/programs');
  },
  adminPrograms(token: string | undefined) {
    return request<Program[]>('/programs/admin', {}, token);
  },
  health() {
    return request<{ ok: boolean; service: string; timestamp: string }>('/health');
  },
  createArticle(
    token: string | undefined,
    payload: {
      slug: string;
      title: string;
      excerpt: string;
      body: string;
      category: string;
      coverUrl?: string;
      eventId?: number | null;
      status?: 'DRAFT' | 'PUBLISHED';
    }
  ) {
    return request<Article>('/articles', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  createCommunitySubmission(payload: {
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    category: 'Eventos' | 'Galeria';
    coverUrl?: string;
    eventId?: number | null;
  }) {
    return request<Article>('/articles/community-submissions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  createEventGallerySubmission(
    eventId: number,
    payload: {
      slug: string;
      title: string;
      excerpt: string;
      body: string;
      coverUrl?: string;
    }
  ) {
    return request<Article>(`/articles/${eventId}/gallery-submissions`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, category: 'Galeria', eventId })
    });
  },
  updateArticle(token: string | undefined, id: number, payload: Partial<Article>) {
    return request<Article>(`/articles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
  },
  deleteArticle(token: string | undefined, id: number) {
    return request<Article>(`/articles/${id}`, { method: 'DELETE' }, token);
  },
  async uploadImage(token: string | undefined, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const uploaded = await uploadRequest<{ path: string; filename: string; mimetype: string; size: number }>(
      '/uploads/images',
      formData,
      token
    );
    return {
      ...uploaded,
      url: `${API_URL}${uploaded.path}`
    };
  },
  async uploadPublicImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/uploads/public/images`, {
      method: 'POST',
      cache: 'no-store',
      body: formData
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? 'No se pudo subir el archivo.');
    }

    const uploaded = await response.json() as { path: string; filename: string; mimetype: string; size: number };
    return {
      ...uploaded,
      url: `${API_URL}${uploaded.path}`
    };
  },
  async uploadPublicImageFromUrl(url: string) {
    const uploaded = await request<{ path: string; filename: string; mimetype: string; size: number }>(
      '/uploads/public/images/from-url',
      {
        method: 'POST',
        body: JSON.stringify({ url })
      }
    );
    return {
      ...uploaded,
      url: `${API_URL}${uploaded.path}`
    };
  },
  async uploadImageFromUrl(token: string | undefined, url: string) {
    try {
      const uploaded = await request<{ path: string; filename: string; mimetype: string; size: number }>(
        '/uploads/images/from-url',
        {
          method: 'POST',
          body: JSON.stringify({ url })
        },
        token
      );
      return {
        ...uploaded,
        url: `${API_URL}${uploaded.path}`
      };
    } catch (error) {
      const response = await fetch(url);
      if (!response.ok) throw error;
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw error;
      const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const file = new File([blob], `imported-image.${extension}`, { type: blob.type });
      return api.uploadImage(token, file);
    }
  },
  createProgram(
    token: string | undefined,
    payload: {
      slug: string;
      name: string;
      host: string;
      description: string;
      schedule: string;
      imageUrl?: string;
      status?: 'ACTIVE';
    }
  ) {
    return request<Program>('/programs', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  updateProgram(token: string | undefined, id: number, payload: Partial<Program>) {
    return request<Program>(`/programs/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
  },
  deleteProgram(token: string | undefined, id: number) {
    return request<Program>(`/programs/${id}`, { method: 'DELETE' }, token);
  },
  createRankingTrack(token: string | undefined, payload: { title: string; artist: string; artworkUrl?: string; isActive?: boolean }) {
    return request<RankingTrack>('/ranking', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  updateRankingTrack(token: string | undefined, id: number, payload: Partial<RankingTrack>) {
    return request<RankingTrack>(`/ranking/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
  },
  deleteRankingTrack(token: string | undefined, id: number) {
    return request<RankingTrack>(`/ranking/${id}`, { method: 'DELETE' }, token);
  },
  frequencies() {
    return request<Frequency[]>('/frequencies');
  },
  adminFrequencies(token: string | undefined) {
    return request<Frequency[]>('/frequencies/admin', {}, token);
  },
  createFrequency(
    token: string | undefined,
    payload: { city: string; dial: string; description?: string; isActive?: boolean; sortOrder?: number }
  ) {
    return request<Frequency>('/frequencies', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  updateFrequency(token: string | undefined, id: number, payload: Partial<Frequency>) {
    return request<Frequency>(`/frequencies/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
  },
  deleteFrequency(token: string | undefined, id: number) {
    return request<Frequency>(`/frequencies/${id}`, { method: 'DELETE' }, token);
  }
};
