const WD_API_BASE = (import.meta.env.VITE_MANGA_API_URL || 'https://wd.suicaodex.com').replace(/\/$/, '');
const WD_IMAGE_BASE = (import.meta.env.VITE_MANGA_IMAGE_URL || 'https://i.suicaodex.com').replace(/\/$/, '');
const WD_READER_BASE = (import.meta.env.VITE_MANGA_READER_URL || 'https://suicaodex.com/manga').replace(/\/$/, '');
const MOE_API_BASE = (import.meta.env.VITE_MOE_API_URL || 'https://moe.suicaodex.com').replace(/\/$/, '');
const MOE_READER_BASE = (import.meta.env.VITE_MOE_READER_URL || 'https://moetruyen.net/manga').replace(/\/$/, '');

export type MangaSource = 'wd' | 'moe';
export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
export type MangaDemographic = 'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none';

export type MangaGenreOption = {
  key: string;
  name: string;
  wdTagId?: string;
  moeGenreId?: number;
};

export type MangaFilters = {
  genre?: MangaGenreOption;
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
  source: MangaSource;
  sourceKey: string;
  sourceLabel: string;
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

type WdRawManga = {
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

type WdFeed<T> = {
  data: T[];
  limit: number;
  page: number;
  total: number;
};

type MoeGenre = {
  id: number;
  name: string;
  count?: number;
};

type MoeRawManga = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  author: string | null;
  status: string;
  coverUrl: string | null;
  chapterCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  genres?: MoeGenre[];
  stats?: {
    commentCount?: number;
    totalViews?: number;
    bookmarkCount?: number;
  };
};

type MoeEnvelope<T> = {
  success: true;
  data: T;
  meta: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

type SourcePool = {
  source: MangaSource;
  items: MangaItem[];
  total: number;
};

export type MangaPoolResult = {
  items: MangaItem[];
  total: number;
  sources: MangaSource[];
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

function normalizeGenreKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function rarityFromStats(views: number, follows: number): 0 | 1 | 2 | 3 | 4 {
  const score = Math.log10(views + 1) + Math.log10(follows * 10 + 1);
  if (score >= 10.5) return 4;
  if (score >= 9.5) return 3;
  if (score >= 8.5) return 2;
  if (score >= 7) return 1;
  return 0;
}

function normalizeWdManga(raw: WdRawManga): MangaItem {
  const stats = raw.relationships?.stats;
  const views = Math.max(0, stats?.views ?? 0);
  const follows = Math.max(0, stats?.follows ?? 0);
  const chapters = Math.max(0, stats?.chapters ?? 0);
  const coverId = raw.relationships?.cover?.id;

  return {
    id: raw.id,
    source: 'wd',
    sourceKey: `wd:${raw.id}`,
    sourceLabel: 'Suicaodex',
    title: raw.title,
    description: raw.description?.trim() || '',
    coverUrl: coverId ? `${WD_IMAGE_BASE}/covers/${encodeURIComponent(raw.id)}/${encodeURIComponent(coverId)}.512.webp` : null,
    status: raw.status ?? null,
    demographic: raw.demographic ?? null,
    year: raw.year ?? null,
    tags: raw.relationships?.tags ?? [],
    views,
    follows,
    chapters,
    rarity: rarityFromStats(views, follows),
    readerUrl: `${WD_READER_BASE}/${encodeURIComponent(raw.id)}/${slugify(raw.title)}`,
  };
}

function normalizeMoeManga(raw: MoeRawManga): MangaItem {
  const views = Math.max(0, raw.stats?.totalViews ?? 0);
  const follows = Math.max(0, raw.stats?.bookmarkCount ?? 0);
  const chapters = Math.max(0, raw.chapterCount ?? 0);

  return {
    id: String(raw.id),
    source: 'moe',
    sourceKey: `moe:${raw.id}`,
    sourceLabel: 'MoeTruyen',
    title: raw.title,
    description: raw.description?.trim() || '',
    coverUrl: raw.coverUrl || null,
    status: raw.status || null,
    demographic: null,
    year: null,
    tags: (raw.genres ?? []).map((genre) => ({ id: `moe:${genre.id}`, name: genre.name, group: 'genre' })),
    views,
    follows,
    chapters,
    rarity: rarityFromStats(views, follows),
    readerUrl: `${MOE_READER_BASE}/${encodeURIComponent(String(raw.id))}`,
  };
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function mixPools(pools: SourcePool[]): MangaItem[] {
  const queues = shuffle(pools).map((pool) => shuffle(pool.items));
  const mixed: MangaItem[] = [];
  let index = 0;
  while (queues.some((queue) => queue.length)) {
    const queue = queues[index % queues.length];
    if (queue.length) mixed.push(queue.shift()!);
    index++;
  }
  return mixed;
}

async function getWdJson<T>(path: string, params: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const query = params.toString();
  const response = await fetch(`${WD_API_BASE}${path}${query ? `?${query}` : ''}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Suicaodex API ${response.status}`);
  return response.json() as Promise<T>;
}

async function getMoeJson<T>(path: string, params = new URLSearchParams(), signal?: AbortSignal): Promise<T> {
  const query = params.toString();
  const response = await fetch(`${MOE_API_BASE}${path}${query ? `?${query}` : ''}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`MoeTruyen API ${response.status}`);
  return response.json() as Promise<T>;
}

function applyWdFilters(params: URLSearchParams, filters: MangaFilters) {
  params.append('contentRating', 'safe');
  params.set('hasChapters', 'true');
  if (filters.genre?.wdTagId) params.append('tag', filters.genre.wdTagId);
  if (filters.status) params.append('status', filters.status);
  if (filters.demographic) params.append('demographic', filters.demographic);
}

function applyMoeFilters(params: URLSearchParams, filters: MangaFilters) {
  params.set('hasChapters', '0');
  params.set('include', 'stats,genres');
  if (filters.genre?.moeGenreId) params.set('genre', String(filters.genre.moeGenreId));
  if (filters.status) params.set('status', filters.status);
}

function wdSupports(filters: MangaFilters) {
  return !filters.genre || Boolean(filters.genre.wdTagId);
}

function moeSupports(filters: MangaFilters) {
  if (filters.demographic) return false;
  return !filters.genre || Boolean(filters.genre.moeGenreId);
}

async function fetchWdGenres(signal?: AbortSignal): Promise<MangaGenreOption[]> {
  const params = new URLSearchParams({ limit: '100', page: '1' });
  const feed = await getWdJson<WdFeed<MangaTag>>('/manga/tag', params, signal);
  return feed.data
    .filter((tag) => tag.group === 'genre')
    .map((tag) => ({ key: normalizeGenreKey(tag.name), name: tag.name, wdTagId: tag.id }));
}

async function fetchMoeGenres(signal?: AbortSignal): Promise<MangaGenreOption[]> {
  const response = await getMoeJson<MoeEnvelope<MoeGenre[]>>('/v2/genres', new URLSearchParams(), signal);
  return response.data.map((genre) => ({ key: normalizeGenreKey(genre.name), name: genre.name, moeGenreId: genre.id }));
}

export async function fetchGenres(signal?: AbortSignal): Promise<MangaGenreOption[]> {
  const results = await Promise.allSettled([fetchWdGenres(signal), fetchMoeGenres(signal)]);
  const available = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  if (!available.length && results.every((result) => result.status === 'rejected')) {
    throw new Error('No manga genre source available');
  }

  const merged = new Map<string, MangaGenreOption>();
  for (const genre of available) {
    const current = merged.get(genre.key);
    merged.set(genre.key, {
      key: genre.key,
      name: current?.name || genre.name,
      ...(current?.wdTagId || genre.wdTagId ? { wdTagId: current?.wdTagId || genre.wdTagId } : {}),
      ...(current?.moeGenreId || genre.moeGenreId ? { moeGenreId: current?.moeGenreId || genre.moeGenreId } : {}),
    });
  }
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

async function fetchWdPool(filters: MangaFilters, signal?: AbortSignal): Promise<SourcePool> {
  const limit = 100;
  const firstParams = new URLSearchParams({ limit: String(limit), page: '1', sort: 'lastUploadedChapterAt', order: 'desc' });
  applyWdFilters(firstParams, filters);
  const first = await getWdJson<WdFeed<WdRawManga>>('/manga', firstParams, signal);
  if (first.total <= limit) return { source: 'wd', items: first.data.map(normalizeWdManga), total: first.total };

  const pageCount = Math.ceil(first.total / limit);
  const page = 1 + Math.floor(Math.random() * pageCount);
  if (page === 1) return { source: 'wd', items: first.data.map(normalizeWdManga), total: first.total };

  const pageParams = new URLSearchParams({ limit: String(limit), page: String(page), sort: 'lastUploadedChapterAt', order: 'desc' });
  applyWdFilters(pageParams, filters);
  const selected = await getWdJson<WdFeed<WdRawManga>>('/manga', pageParams, signal);
  return { source: 'wd', items: selected.data.map(normalizeWdManga), total: selected.total };
}

async function fetchMoePool(filters: MangaFilters, signal?: AbortSignal): Promise<SourcePool> {
  const limit = 100;
  const firstParams = new URLSearchParams({ page: '1', limit: String(limit), sort: 'updated_at' });
  applyMoeFilters(firstParams, filters);
  const first = await getMoeJson<MoeEnvelope<MoeRawManga[]>>('/v2/manga', firstParams, signal);
  const total = first.meta.pagination?.total ?? first.data.length;
  const totalPages = first.meta.pagination?.totalPages ?? Math.ceil(total / limit);
  if (total <= limit || totalPages <= 1) return { source: 'moe', items: first.data.map(normalizeMoeManga), total };

  const page = 1 + Math.floor(Math.random() * totalPages);
  if (page === 1) return { source: 'moe', items: first.data.map(normalizeMoeManga), total };

  const pageParams = new URLSearchParams({ page: String(page), limit: String(limit), sort: 'updated_at' });
  applyMoeFilters(pageParams, filters);
  const selected = await getMoeJson<MoeEnvelope<MoeRawManga[]>>('/v2/manga', pageParams, signal);
  return { source: 'moe', items: selected.data.map(normalizeMoeManga), total: selected.meta.pagination?.total ?? total };
}

export async function fetchMangaPool(filters: MangaFilters, signal?: AbortSignal): Promise<MangaPoolResult> {
  const requests: Array<Promise<SourcePool>> = [];
  if (wdSupports(filters)) requests.push(fetchWdPool(filters, signal));
  if (moeSupports(filters)) requests.push(fetchMoePool(filters, signal));
  if (!requests.length) return { items: [], total: 0, sources: [] };

  const results = await Promise.allSettled(requests);
  const pools = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
  if (!pools.length) throw new Error('All manga sources failed');

  return {
    items: mixPools(pools),
    total: pools.reduce((sum, pool) => sum + pool.total, 0),
    sources: pools.map((pool) => pool.source),
  };
}

async function fetchRandomWd(filters: MangaFilters, signal?: AbortSignal): Promise<MangaItem> {
  const params = new URLSearchParams();
  applyWdFilters(params, filters);
  return normalizeWdManga(await getWdJson<WdRawManga>('/manga/random', params, signal));
}

async function fetchRandomMoe(signal?: AbortSignal): Promise<MangaItem> {
  const params = new URLSearchParams({ limit: '1', include: 'stats,genres' });
  const response = await getMoeJson<MoeEnvelope<MoeRawManga[]>>('/v2/manga/random', params, signal);
  if (!response.data[0]) throw new Error('MoeTruyen returned no random manga');
  return normalizeMoeManga(response.data[0]);
}

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export async function fetchRandomManga(filters: MangaFilters, pool: MangaItem[], signal?: AbortSignal): Promise<MangaItem> {
  const availableSources = [...new Set(pool.map((manga) => manga.source))];
  if (!availableSources.length) throw new Error('No manga source available');
  const source = randomFrom(availableSources);
  const sourcePool = pool.filter((manga) => manga.source === source);

  try {
    if (source === 'wd') return await fetchRandomWd(filters, signal);
    if (!filters.genre && !filters.status && !filters.demographic) return await fetchRandomMoe(signal);
    if (sourcePool.length) return randomFrom(sourcePool);
  } catch {
    if (sourcePool.length) return randomFrom(sourcePool);
  }

  return randomFrom(pool);
}
