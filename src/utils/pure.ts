import { MediaItem, FilterState, TicketStub } from '../types/cinema';

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

export function generateTicketBarcode(mediaId: number, watchDate: string): string {
  const sanitizedDate = (watchDate || '20261023').replace(/[^0-9]/g, '');
  const prefix = 'OBSIDIAN';
  const paddedId = String(mediaId).padStart(6, '0');
  return `${prefix}-${paddedId}-${sanitizedDate.slice(0, 8)}`;
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

export interface VaultStats {
  totalTickets: number;
  averageRating: number;
  totalRuntimeHours: number;
  topFinish: string;
}

export function calculateVaultStats(tickets: TicketStub[]): VaultStats {
  if (tickets.length === 0) {
    return {
      totalTickets: 0,
      averageRating: 0,
      totalRuntimeHours: 0,
      topFinish: 'None',
    };
  }

  const sumRatings = tickets.reduce((acc, t) => acc + (t.rating || 0), 0);
  const avgRating = Number((sumRatings / tickets.length).toFixed(1));

  const totalMinutes = tickets.reduce((acc, t) => acc + (t.runtime || 120), 0);
  const totalHours = Number((totalMinutes / 60).toFixed(1));

  // Count finishes
  const finishCounts: Record<string, number> = {};
  for (const t of tickets) {
    finishCounts[t.finish] = (finishCounts[t.finish] || 0) + 1;
  }
  let topFinish = 'iridescent';
  let maxCount = -1;
  for (const [finish, count] of Object.entries(finishCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topFinish = finish;
    }
  }

  const prettyFinishNames: Record<string, string> = {
    iridescent: 'Iridescent Prism',
    gold_leaf: '24K Gold Leaf',
    onyx_chrome: 'Onyx Chrome',
    emerald_noir: 'Emerald Noir',
  };

  return {
    totalTickets: tickets.length,
    averageRating: avgRating,
    totalRuntimeHours: totalHours,
    topFinish: prettyFinishNames[topFinish] || topFinish,
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
      subtitle: `${formatReleaseYear(m)} · ★ ${m.vote_average.toFixed(1)} · ${m.media_type.toUpperCase()}`,
      movie: m,
    };
  });
}

export function mapTicketsToMasonryItems(tickets: TicketStub[]): Array<{
  id: string;
  img: string;
  width: number;
  height: number;
  span: number;
  title: string;
  description: string;
  alt: string;
  rawTicket: TicketStub;
}> {
  return tickets.map((t, idx) => {
    const useBackdrop = (idx % 5 === 2) && Boolean(t.backdropPath);
    const img = useBackdrop && t.backdropPath
      ? (t.backdropPath.startsWith('http') ? t.backdropPath : `/tmdb-img/w780${t.backdropPath}`)
      : (t.posterPath ? (t.posterPath.startsWith('http') ? t.posterPath : `/tmdb-img/w500${t.posterPath}`) : '');

    return {
      id: t.id,
      img,
      width: useBackdrop ? 800 : 600,
      height: useBackdrop ? 480 : (idx % 4 === 1 ? 800 : idx % 4 === 3 ? 960 : 900),
      span: useBackdrop ? 2 : 1,
      title: t.title,
      description: `★ ${t.rating?.toFixed(1) || '5.0'} · Watched ${t.watchDate} · ${t.mediaType.toUpperCase()}`,
      alt: `${t.title} (${t.year})`,
      rawTicket: t,
    };
  });
}
