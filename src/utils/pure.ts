import { MediaItem, FilterState, WatchedEntry } from '../types/cinema';

export function formatReleaseYear(item: { release_date?: string; first_air_date?: string }): string {
  const date = item.release_date || item.first_air_date;
  if (!date) return 'TBA';
  const year = date.split('-')[0];
  return year && year.length === 4 ? year : 'TBA';
}

export function formatRuntime(minutes?: number): string {
  if (!minutes || minutes <= 0) return '2h 14m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function extractCinemaColor(media: MediaItem): { primary: string; secondary: string; glow: string } {
  if (media.dominantColor && media.secondaryColor) {
    return {
      primary: media.dominantColor,
      secondary: media.secondaryColor,
      glow: `rgba(${hexToRgb(media.dominantColor)}, 0.45)`,
    };
  }

  // Genre & title heuristic fallback for lush cinematic hues
  const title = (media.title || '').toLowerCase();
  const genres = media.genre_ids || [];

  if (title.includes('dune') || title.includes('desert') || genres.includes(12)) {
    // Adventure / Epic desert: warm ochre & spice gold
    return { primary: '#c97a2b', secondary: '#f39c12', glow: 'rgba(201, 122, 43, 0.45)' };
  }
  if (title.includes('blade runner') || title.includes('cyber') || genres.includes(878)) {
    // Sci-fi / Cyberpunk: neon cyan & electric violet
    return { primary: '#00d2ff', secondary: '#9b51e0', glow: 'rgba(0, 210, 255, 0.45)' };
  }
  if (title.includes('oppenheimer') || genres.includes(36)) {
    // History / Nuclear: tungsten orange & fire ember
    return { primary: '#e65100', secondary: '#ff9800', glow: 'rgba(230, 81, 0, 0.45)' };
  }
  if (genres.includes(27) || genres.includes(53)) {
    // Horror / Thriller: crimson noir & blood ruby
    return { primary: '#990000', secondary: '#330000', glow: 'rgba(153, 0, 0, 0.45)' };
  }
  if (genres.includes(18)) {
    // Drama: midnight sapphire & royal blue
    return { primary: '#1e3c72', secondary: '#2a5298', glow: 'rgba(30, 60, 114, 0.45)' };
  }
  if (genres.includes(35)) {
    // Comedy: vibrant gold & amber
    return { primary: '#e5a93c', secondary: '#f39c12', glow: 'rgba(229, 169, 60, 0.45)' };
  }

  // Default obsidian amethyst
  return { primary: '#6366f1', secondary: '#8b5cf6', glow: 'rgba(99, 102, 241, 0.45)' };
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '99, 102, 241';
}

export function filterAndSortMedia(
  items: MediaItem[],
  filters: FilterState,
  watchlistIds: Set<number>,
  watchedIds: Set<number>
): MediaItem[] {
  let result = [...items];

  // 1. Text Search
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    result = result.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        (m.overview && m.overview.toLowerCase().includes(query)) ||
        (m.director && m.director.toLowerCase().includes(query))
    );
  }

  // 2. Media Type filter
  if (filters.mediaType !== 'all') {
    result = result.filter((m) => m.media_type === filters.mediaType);
  }

  // 3. Genre filter
  if (filters.genreId !== 'all') {
    result = result.filter((m) => m.genre_ids.includes(filters.genreId as number));
  }

  // 4. Watch status filter
  if (filters.watchStatus === 'watchlist') {
    result = result.filter((m) => watchlistIds.has(m.id));
  } else if (filters.watchStatus === 'watched') {
    result = result.filter((m) => watchedIds.has(m.id));
  }

  // 5. Sorting
  result.sort((a, b) => {
    switch (filters.sortBy) {
      case 'rating':
        return b.vote_average - a.vote_average;
      case 'popularity':
        return (b.popularity ?? b.vote_count) - (a.popularity ?? a.vote_count);
      case 'release': {
        const yearA = parseInt(formatReleaseYear(a), 10) || 0;
        const yearB = parseInt(formatReleaseYear(b), 10) || 0;
        return yearB - yearA;
      }
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return result;
}

export interface WatchedStats {
  totalWatched: number;
  averageRating: number;
  totalRuntimeHours: number;
  movieCount: number;
  tvCount: number;
}

export function calculateWatchedStats(movies: MediaItem[], watchedEntries: WatchedEntry[] = []): WatchedStats {
  if (movies.length === 0) {
    return {
      totalWatched: 0,
      averageRating: 0,
      totalRuntimeHours: 0,
      movieCount: 0,
      tvCount: 0,
    };
  }

  const entriesMap = new Map(watchedEntries.map((e) => [e.mediaId, e]));
  const sumRatings = movies.reduce((acc, m) => {
    const entry = entriesMap.get(m.id);
    const score = entry?.rating ?? (m.vote_average ? m.vote_average / 2 : 4.5);
    return acc + score;
  }, 0);
  const avgRating = Number((sumRatings / movies.length).toFixed(1));

  const totalMinutes = movies.reduce((acc, m) => acc + (m.runtime || 120), 0);
  const totalHours = Number((totalMinutes / 60).toFixed(1));

  const movieCount = movies.filter((m) => m.media_type === 'movie').length;
  const tvCount = movies.filter((m) => m.media_type === 'tv').length;

  return {
    totalWatched: movies.length,
    averageRating: avgRating,
    totalRuntimeHours: totalHours,
    movieCount,
    tvCount,
  };
}

export function mapMediaToFlexCarouselItems(items: MediaItem[]): Array<{
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  movie: MediaItem;
}> {
  return items.map((m) => {
    let src = '';
    if (m.poster_path) {
      src = m.poster_path.startsWith('http') ? m.poster_path : `/tmdb-img/w500${m.poster_path}`;
    }
    return {
      src,
      alt: m.overview || m.title,
      title: m.title,
      subtitle: `${formatReleaseYear(m)} · ★ ${m.vote_average?.toFixed(1) || '8.0'} · ${(m.media_type || 'movie').toUpperCase()}`,
      movie: m,
    };
  });
}

export function mapMediaToMasonryItems(
  items: MediaItem[],
  watchedEntries: WatchedEntry[] = []
): Array<{
  id: string;
  img: string;
  width: number;
  height: number;
  span: number;
  title: string;
  description: string;
  alt: string;
  rawMedia: MediaItem;
}> {
  const entriesMap = new Map(watchedEntries.map((e) => [e.mediaId, e]));

  return items.map((m, idx) => {
    const useBackdrop = (idx % 5 === 2) && Boolean(m.backdrop_path);
    const img = useBackdrop && m.backdrop_path
      ? (m.backdrop_path.startsWith('http') ? m.backdrop_path : `/tmdb-img/w780${m.backdrop_path}`)
      : (m.poster_path ? (m.poster_path.startsWith('http') ? m.poster_path : `/tmdb-img/w500${m.poster_path}`) : '');

    const entry = entriesMap.get(m.id);
    const description = entry
      ? `★ ${(entry.rating ?? 5.0).toFixed(1)}/5.0 · Watched ${entry.watchDate || formatReleaseYear(m)} · ${(m.media_type || 'movie').toUpperCase()}`
      : `★ ${m.vote_average?.toFixed(1) || '8.0'} · ${formatReleaseYear(m)} · ${(m.media_type || 'movie').toUpperCase()}`;

    return {
      id: String(m.id),
      img,
      width: useBackdrop ? 800 : 600,
      height: useBackdrop ? 480 : (idx % 4 === 1 ? 800 : idx % 4 === 3 ? 960 : 900),
      span: useBackdrop ? 2 : 1,
      title: m.title,
      description,
      alt: `${m.title} (${formatReleaseYear(m)})`,
      rawMedia: m,
    };
  });
}

/**
 * Frame-budgeted exponential decay / lerp step for decoupled rAF animation loops
 */
export function dampSpringStep(current: number, target: number, tau: number, dt: number): number {
  const safeDt = Math.max(0, dt);
  const factor = 1 - Math.exp(-safeDt / Math.max(tau, 0.001));
  return current + (target - current) * factor;
}

