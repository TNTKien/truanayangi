import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ExternalLink, History, RefreshCw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { CaseAudio } from '@/lib/case-audio';
import { createSpinProfile, spinProgress, stopFraction } from '@/lib/case-mechanics';
import {
  fetchMangaPool,
  fetchRandomManga,
  fetchTags,
  type MangaDemographic,
  type MangaFilters,
  type MangaItem,
  type MangaStatus,
  type MangaTag,
} from '@/lib/manga-api';

const colors = ['#4b69ff', '#8847ff', '#d32ce6', '#eb4b4b', '#e4ae39'];
const tiers = ['Khám phá', 'Nổi bật', 'Phổ biến', 'Hot', 'Đặc biệt'];
const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const HISTORY_KEY = 'homnaydocgi:recent';
const SPIN_KEY = 'homnaydocgi:spins';
const HISTORY_LIMIT = 30;
const STEP = 254;
const TILE_WIDTH = 240;

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}

function statusLabel(status: string | null) {
  return ({ ongoing: 'Đang tiến hành', completed: 'Hoàn thành', hiatus: 'Tạm ngưng', cancelled: 'Đã hủy' } as Record<string, string>)[status || ''] || 'Không rõ';
}

function demographicLabel(value: string | null) {
  return ({ shounen: 'Shounen', shoujo: 'Shoujo', seinen: 'Seinen', josei: 'Josei', none: 'Khác' } as Record<string, string>)[value || ''] || 'Khác';
}

function MangaCard({ manga, slot, compact = false }: { manga: MangaItem; slot?: number; compact?: boolean }) {
  const style = {
    '--rarity': colors[manga.rarity],
    ...(slot === undefined ? {} : { position: 'absolute', left: slot * STEP }),
  } as React.CSSProperties;

  return (
    <article className={`manga-card ${compact ? 'compact' : ''}`} style={style} data-manga-id={manga.id}>
      <span className="tier">{tiers[manga.rarity]}</span>
      <div className="cover-wrap">
        {manga.coverUrl ? <img src={manga.coverUrl} alt={`Bìa ${manga.title}`} loading={compact ? 'lazy' : 'eager'} /> : <div className="cover-fallback"><BookOpen size={48} /></div>}
      </div>
      <div className="card-copy">
        <strong title={manga.title}>{manga.title}</strong>
        <span>{manga.year || '—'} · {statusLabel(manga.status)}</span>
      </div>
    </article>
  );
}

function ResultDialog({ manga, onClose }: { manga: MangaItem; onClose: () => void }) {
  const genres = manga.tags.filter((tag) => tag.group === 'genre').slice(0, 5);
  return (
    <div className="result-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="result-dialog" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <button className="dialog-close" onClick={onClose} aria-label="Đóng">×</button>
        <div className="result-cover">
          {manga.coverUrl ? <img src={manga.coverUrl} alt={`Bìa ${manga.title}`} /> : <div className="cover-fallback"><BookOpen size={64} /></div>}
        </div>
        <div className="result-content">
          <span className="result-kicker"><Sparkles size={14} /> Hôm nay đọc</span>
          <h2 id="result-title">{manga.title}</h2>
          <div className="result-meta">
            <span>{statusLabel(manga.status)}</span><span>{demographicLabel(manga.demographic)}</span>{manga.year ? <span>{manga.year}</span> : null}
          </div>
          {genres.length ? <div className="tag-list">{genres.map((tag) => <span key={tag.id}>{tag.name}</span>)}</div> : null}
          {manga.description ? <p>{manga.description}</p> : <p className="muted">Chưa có mô tả.</p>}
          <div className="stats"><span>{formatNumber(manga.views)} lượt xem</span><span>{formatNumber(manga.follows)} theo dõi</span><span>{formatNumber(manga.chapters)} chương</span></div>
          <a className="read-button" href={manga.readerUrl} target="_blank" rel="noreferrer">Đọc trên Suicaodex <ExternalLink size={17} /></a>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const [tags, setTags] = useState<MangaTag[]>([]);
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState<MangaStatus | ''>('');
  const [demographic, setDemographic] = useState<MangaDemographic | ''>('');
  const [pool, setPool] = useState<MangaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState(false);
  const [apiError, setApiError] = useState('');
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<MangaItem | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [spinCount, setSpinCount] = useState(0);
  const [sound, setSound] = useState(true);
  const [reel, setReel] = useState<Array<{ manga: MangaItem; id: number }>>([]);
  const busy = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const audio = useRef<CaseAudio | null>(null);

  const filters = useMemo<MangaFilters>(() => ({
    ...(genre ? { tagId: genre } : {}),
    ...(status ? { status } : {}),
    ...(demographic ? { demographic } : {}),
  }), [genre, status, demographic]);

  useEffect(() => {
    document.documentElement.lang = 'vi';
    document.title = 'Hôm nay đọc gì?';
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(saved)) setRecentIds(saved.filter((id): id is string => typeof id === 'string').slice(0, HISTORY_LIMIT));
      setSpinCount(Number(localStorage.getItem(SPIN_KEY) || 0) || 0);
    } catch {}
  }, []);

  useEffect(() => {
    const engine = new CaseAudio(basePath);
    audio.current = engine;
    engine.preload();
    return () => { cancelAnimationFrame(frame.current); engine.dispose(); audio.current = null; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTags(controller.signal).then(setTags).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setApiError('');
    fetchMangaPool(filters, controller.signal)
      .then(({ items, total: count }) => {
        setPool(items);
        setTotal(count);
        if (!spinning) setReel(items.slice(0, 12).map((manga, id) => ({ manga, id })));
        if (!items.length) setApiError('Không tìm thấy manga phù hợp với bộ lọc này.');
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setPool([]);
        setApiError('Không tải được dữ liệu từ wd.suicaodex.com. Hãy thử lại.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, refreshNonce]);

  const visiblePool = useMemo(() => pool.slice(0, 18), [pool]);
  const available = useMemo(() => {
    const unseen = pool.filter((manga) => !recentIds.includes(manga.id));
    return unseen.length >= 5 ? unseen : pool;
  }, [pool, recentIds]);

  const saveWinner = useCallback((winner: MangaItem) => {
    setRecentIds((current) => {
      const next = [winner.id, ...current.filter((id) => id !== winner.id)].slice(0, HISTORY_LIMIT);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setSpinCount((current) => {
      const next = current + 1;
      try { localStorage.setItem(SPIN_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  async function openCase() {
    if (busy.current || loading || !pool.length || !viewport.current || !track.current) return;
    busy.current = true;
    setChoosing(true);
    audio.current?.unlock();

    let winner: MangaItem;
    try {
      const fromApi = await fetchRandomManga(filters);
      winner = recentIds.includes(fromApi.id) && available.length ? randomFrom(available) : fromApi;
    } catch {
      winner = randomFrom(available.length ? available : pool);
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const profile = createSpinProfile(Math.random, reducedMotion);
    const winnerIndex = profile.tiles;
    const items: Array<{ manga: MangaItem; id: number }> = [];
    const recentFillers: string[] = [];
    for (let id = 0; id <= winnerIndex + 4; id++) {
      if (id === winnerIndex) {
        items.push({ id, manga: winner });
        continue;
      }
      const candidates = pool.filter((manga) => !recentFillers.includes(manga.id) && manga.id !== winner.id);
      const manga = randomFrom(candidates.length ? candidates : pool);
      items.push({ id, manga });
      recentFillers.push(manga.id);
      if (recentFillers.length > 8) recentFillers.shift();
    }

    flushSync(() => {
      setReel(items);
      setResult(null);
      setSpinning(true);
      setChoosing(false);
    });

    const width = viewport.current.clientWidth;
    const end = width / 2 - TILE_WIDTH * stopFraction() - winnerIndex * STEP;
    const element = track.current;
    element.style.transform = 'translate3d(0,0,0)';
    audio.current?.play('csgo_ui_crate_open');
    const started = performance.now();
    let lastCell = 0;

    const animate = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / profile.durationMs));
      const next = end * spinProgress(progress, profile.friction);
      element.style.transform = `translate3d(${next}px,0,0)`;
      const cell = Math.floor((-next + width / 2) / STEP);
      if (cell !== lastCell) { audio.current?.play('csgo_ui_crate_item_scroll'); lastCell = cell; }
      if (progress < 1) { frame.current = requestAnimationFrame(animate); return; }

      saveWinner(winner);
      setSpinning(false);
      setResult(winner);
      busy.current = false;
      const reveal = ['item_reveal3_rare', 'item_reveal4_mythical', 'item_reveal5_legendary', 'item_reveal6_ancient', 'item_reveal6_ancient'] as const;
      audio.current?.play(reveal[winner.rarity]);
    };
    frame.current = requestAnimationFrame(animate);
  }

  function clearHistory() {
    setRecentIds([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  }

  return (
    <div className="site-shell">
      <header>
        <a className="brand" href={`${basePath || ''}/`}><span className="brand-icon"><BookOpen size={20} /></span>Hôm Nay Đọc Gì<span className="brand-dot">?</span></a>
        <div className="header-actions">
          <button className="sound-button" onClick={() => { const next = !sound; setSound(next); audio.current?.setMuted(!next); }} aria-label={sound ? 'Tắt âm thanh' : 'Bật âm thanh'}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}<span>{sound ? 'Âm thanh' : 'Đã tắt'}</span></button>
          <a className="github-button" href="https://github.com/TNTKien/truanayangi" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </header>

      <main>
        <section className="intro">
          <div>
            <div className="eyebrow"><span />MANGA DISCOVERY CASE</div>
            <h1>Hôm nay <em>đọc gì?</em></h1>
            <p>Chọn gu, mở hòm và để Suicaodex chọn một manga cho bạn.</p>
          </div>
          <div className="edition"><div><b>{formatNumber(total)}</b><br />MANGA PHÙ HỢP</div><div><b>{spinCount}</b><br />LẦN ĐÃ QUAY</div></div>
        </section>

        <section className="case-panel">
          <div className="case-top"><span><span className="mini-cross">✦</span>SUICAODEX DISCOVERY CASE</span><b>SAFE ONLY</b></div>
          <div className="reel-window" ref={viewport}>
            <div className="reel-track" ref={track}>{reel.map(({ manga, id }) => <MangaCard manga={manga} slot={id} key={`${id}-${manga.id}`} />)}</div>
            <div className="selector-line" />
            <div className="reel-fade left" /><div className="reel-fade right" />
            {loading ? <div className="reel-state">Đang tải manga…</div> : null}
          </div>
          <div className="case-bottom"><span><i />API: wd.suicaodex.com</span><span>Không lặp {HISTORY_LIMIT} manga gần nhất khi có thể</span></div>
        </section>

        <section className="control-bar">
          <div className="filters">
            <label>Thể loại<select value={genre} onChange={(e) => setGenre(e.target.value)} disabled={spinning}><option value="">Tất cả thể loại</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label>
            <label>Trạng thái<select value={status} onChange={(e) => setStatus(e.target.value as MangaStatus | '')} disabled={spinning}><option value="">Tất cả</option><option value="ongoing">Đang tiến hành</option><option value="completed">Hoàn thành</option><option value="hiatus">Tạm ngưng</option><option value="cancelled">Đã hủy</option></select></label>
            <label>Đối tượng<select value={demographic} onChange={(e) => setDemographic(e.target.value as MangaDemographic | '')} disabled={spinning}><option value="">Tất cả</option><option value="shounen">Shounen</option><option value="shoujo">Shoujo</option><option value="seinen">Seinen</option><option value="josei">Josei</option></select></label>
            <button className="icon-button" onClick={() => setRefreshNonce((n) => n + 1)} disabled={spinning || loading} title="Đổi pool manga"><RefreshCw size={17} /></button>
          </div>
          <div className="open-wrap"><button className="open-button" onClick={openCase} disabled={spinning || choosing || loading || !pool.length}>{choosing ? 'ĐANG CHỌN…' : spinning ? 'ĐANG QUAY…' : 'MỞ HÒM'}<span>›</span></button><span>{apiError || `${pool.length} manga đang nằm trong hòm`}</span></div>
        </section>

        <section className="inventory-section">
          <div className="section-heading"><div><div className="eyebrow"><span />POOL HIỆN TẠI</div><h2>Manga có thể xuất hiện <span>{pool.length}</span></h2></div><div className="history-actions"><span><History size={14} /> {recentIds.length} manga gần đây</span>{recentIds.length ? <button onClick={clearHistory}>Xóa lịch sử</button> : null}</div></div>
          {apiError && !pool.length ? <div className="empty-state"><BookOpen size={34} /><strong>{apiError}</strong><button onClick={() => setRefreshNonce((n) => n + 1)}>Thử lại</button></div> : <div className="inventory-grid">{visiblePool.map((manga) => <MangaCard manga={manga} compact key={manga.id} />)}</div>}
        </section>
      </main>

      <footer><span>Hôm Nay Đọc Gì · powered by Suicaodex</span><span>Dữ liệu manga từ wd.suicaodex.com</span></footer>
      {result ? <ResultDialog manga={result} onClose={() => setResult(null)} /> : null}
    </div>
  );
}
