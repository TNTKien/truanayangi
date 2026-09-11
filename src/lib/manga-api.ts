const API_BASE = (import.meta.env.VITE_MANGA_API_URL || 'https://wd.suicaodex.com').replace(/\/$/, '');
const IMAGE_BASE = (import.meta.env.VITE_MANGA_IMAGE_URL || 'https://i.suicaodex.com').replace(/\/$/, '');
const READER_BASE = (import.meta.env.VITE_MANGA_READER_URL || 'https://suicaodex.com/manga').replace(/\/$/, '');

export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
export type MangaDemographic = 'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none';

export type MangaFilters = {
  tagId?: string;
  status?: MangaStatus;
  demographic?: MangaDemographic;
};

export type MangaTag = {
  id: string;
  name: string;
  group: string;
};

export type MangaItem = {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  status: string | null;
  demographic: string | null;
  year: number | null;
  tags: MangaTag[];
  views: number;
  follows: number;
  chapters: number;
  rarity: 0 | 1 | 2 | 3 | 4;
  readerUrl: string;
};

type RawManga = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  demographic?: string | null;
  year?: number | null;
  relationships?: {
    cover?: { id: string };
    tags?: MangaTag[];
    stats?: { views?: number; follows?: number; chapters?: number };
  };
};

type Feed<T> = {
  data: T[];
  limit: number;
  page: number;
  total: number;
};

function slugify(value: string) {
  return value
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'manga';
}

function rarityFromStats(views: number, follows: number): 0 | 1 | 2 | 3 | 4 {
  const score = Math.log10(views + 1) + Math.log10(follows * 10 + 1);
  if (score >= 10.5) return 4;
  if (score >= 9.5) return 3;
  if (score >= 8.5) return 2;
  if (score >= 7) return 1;
  return 0;
}

function normalizeManga(raw: RawManga): MangaItem {
  const stats = raw.relationships?.stats;
  const views = Math.max(0, stats?.views ?? 0);
  const follows = Math.max(0, stats?.follows ?? 0);
  const chapters = Math.max(0, stats?.chapters ?? 0);
  const coverId = raw.relationships?.cover?.id;

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description?.trim() || '',
    coverUrl: coverId ? `${IMAGE_BASE}/covers/${encodeURIComponent(raw.id)}/${encodeURIComponent(coverId)}.512.webp` : null,
    status: raw.status ?? null,
    demographic: raw.demographic ?? null,
    year: raw.year ?? null,
    tags: raw.relationships?.tags ?? [],
    views,
    follows,
    chapters,
    rarity: rarityFromStats(views, follows),
    readerUrl: `${READER_BASE}/${encodeURIComponent(raw.id)}/${slugify(raw.title)}`,
  };
}

function applyFilters(params: URLSearchParams, filters: MangaFilters) {
  params.append('contentRating', 'safe');
  params.set('hasChapters', 'true');
  if (filters.tagId) params.append('tag', filters.tagId);
  if (filters.status) params.append('status', filters.status);
  if (filters.demographic) params.append('demographic', filters.demographic);
}

async function getJson<T>(path: string, params: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Suicaodex API ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchTags(signal?: AbortSignal): Promise<MangaTag[]> {
  const params = new URLSearchParams({ limit: '100', page: '1' });
  const feed = await getJson<Feed<MangaTag>>('/manga/tag', params, signal);
  return feed.data
    .filter((tag) => tag.group === 'genre')
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchMangaPool(filters: MangaFilters, signal?: AbortSignal): Promise<{ items: MangaItem[]; total: number }> {
  const limit = 100;
  const firstParams = new URLSearchParams({ limit: String(limit), page: '1', sort: 'lastUploadedChapterAt', order: 'desc' });
  applyFilters(firstParams, filters);
  const first = await getJson<Feed<RawManga>>('/manga', firstParams, signal);
  if (first.total <= limit) return { items: first.data.map(normalizeManga), total: first.total };

  const pageCount = Math.ceil(first.total / limit);
  const page = 1 + Math.floor(Math.random() * pageCount);
  if (page === 1) return { items: first.data.map(normalizeManga), total: first.total };

  const pageParams = new URLSearchParams({ limit: String(limit), page: String(page), sort: 'lastUploadedChapterAt', order: 'desc' });
  applyFilters(pageParams, filters);
  const selected = await getJson<Feed<RawManga>>('/manga', pageParams, signal);
  return { items: selected.data.map(normalizeManga), total: selected.total };
}

export async function fetchRandomManga(filters: MangaFilters, signal?: AbortSignal): Promise<MangaItem> {
  const params = new URLSearchParams();
  applyFilters(params, filters);
  const manga = await getJson<RawManga>('/manga/random', params, signal);
  return normalizeManga(manga);
}
