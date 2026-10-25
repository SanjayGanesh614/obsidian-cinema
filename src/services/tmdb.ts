import { MediaItem, MediaType, Genre } from '../types/cinema';
import { logTMDBApiCall, saveMediaItemsBatch, getCachedMediaItems, searchCachedMedia, updateMediaDetailsInDb } from './neonDb';

const API_KEY = 'a14bfb63af56c3b94c2609ee587fd070';
const READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTRiZmI2M2FmNTZjM2I5NGMyNjA5ZWU1ODdmZDA3MCIsIm5iZiI6MTc5Mjc5ODQyMi40MDgsInN1YiI6IjZhZGJlZWQ2MmVjYjNlNzkzMDIxYzZlNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.La5rHfeC0UmxHjGAPyiZE1r_RQvn5uVhHDfICA_RwHE';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface FullGenre {
  id: number;
  name: string;
  mediaType: 'movie' | 'tv' | 'both';
  badge: string;
  description: string;
  icon?: string;
}

// All 19 TMDB Movie Genres
export const ALL_MOVIE_GENRES: FullGenre[] = [
  { id: 28, name: 'Action', mediaType: 'movie', badge: 'KINETIC · COMBAT · STUNTS', description: 'High-octane choreography and relentless adrenaline.' },
  { id: 12, name: 'Adventure', mediaType: 'movie', badge: 'ODYSSEY · EXPLORATION', description: 'Epic voyages across uncharted lands and cosmic vistas.' },
  { id: 16, name: 'Animation', mediaType: 'movie', badge: 'GRAPHIC VISION · CRAFT', description: 'Masterclasses in visual imagination and cell artistry.' },
  { id: 35, name: 'Comedy', mediaType: 'movie', badge: 'WIT · SATIRE · ABSURDISM', description: 'Sharp screenplays, human folly, and razor-sharp levity.' },
  { id: 80, name: 'Crime', mediaType: 'movie', badge: 'UNDERWORLD · SYNDICATES', description: 'Moral gray zones, heists, and underworld machinations.' },
  { id: 99, name: 'Documentary', mediaType: 'movie', badge: 'CINEMA VERITE · ARCHIVE', description: 'Unfiltered truths and historical investigative portraits.' },
  { id: 18, name: 'Drama', mediaType: 'movie', badge: 'HUMAN CONDITION · PATHOS', description: 'Intimate psychological studies and resonant character arcs.' },
  { id: 10751, name: 'Family', mediaType: 'movie', badge: 'UNIVERSAL WONDER', description: 'Stories that span generations with timeless emotion.' },
  { id: 14, name: 'Fantasy', mediaType: 'movie', badge: 'MYTHOLOGY · ENCHANTMENT', description: 'Worlds built on ancient prophecy, spellcraft, and wonder.' },
  { id: 36, name: 'History', mediaType: 'movie', badge: 'PERIOD CHRONICLES', description: 'Meticulous reconstructions of turning points in human history.' },
  { id: 27, name: 'Horror', mediaType: 'movie', badge: 'DREAD · VISCERAL TERROR', description: 'Atmospheric frights, psychological decay, and nightmares.' },
  { id: 10402, name: 'Music', mediaType: 'movie', badge: 'ACOUSTIC RESONANCE', description: 'Sonic journeys, backstage memoirs, and rhythm-fueled dramas.' },
  { id: 9648, name: 'Mystery', mediaType: 'movie', badge: 'ENIGMA · CLUES · TWISTS', description: 'Labyrinths of deception where every detail is a cipher.' },
  { id: 10749, name: 'Romance', mediaType: 'movie', badge: 'INTIMACY · PASSION', description: 'Electrifying chemistry, star-crossed fates, and longing.' },
  { id: 878, name: 'Sci-Fi', mediaType: 'movie', badge: 'ASTRO-PHYSICS · SPECULATION', description: 'Technological singularities, deep space, and existential questions.' },
  { id: 10770, name: 'TV Movie', mediaType: 'movie', badge: 'TELEVISION EDITIONS', description: 'Crafted features made specifically for broadcast screens.' },
  { id: 53, name: 'Thriller', mediaType: 'movie', badge: 'SUSPENSE · VELOCITY', description: 'Nail-biting tension, ticking clocks, and high stakes.' },
  { id: 10752, name: 'War', mediaType: 'movie', badge: 'CONFLICT · VALOR · VALE', description: 'The visceral reality, brotherhood, and tragedy of combat.' },
  { id: 37, name: 'Western', mediaType: 'movie', badge: 'FRONTIER JUSTICE', description: 'Dust, morality, and solitary figures facing wild terrain.' },
];

// All 16 TMDB TV Genres
export const ALL_TV_GENRES: FullGenre[] = [
  { id: 10759, name: 'Action & Adventure', mediaType: 'tv', badge: 'EPISODIC ODYSSEY', description: 'Sweeping episodic escapades and pulse-pounding stunts.' },
  { id: 16, name: 'Animation', mediaType: 'tv', badge: 'ANIMATED SERIES', description: 'Groundbreaking serialized animation from around the globe.' },
  { id: 35, name: 'Comedy', mediaType: 'tv', badge: 'COMEDIC EPISODES', description: 'Sitcom brilliance, workplace satire, and modern humor.' },
  { id: 80, name: 'Crime', mediaType: 'tv', badge: 'PROCEDURAL & DETECTIVE', description: 'Gritty investigations, organized syndicates, and forensic drama.' },
  { id: 99, name: 'Documentary', mediaType: 'tv', badge: 'DOCUSERIES', description: 'Deep investigative multi-part chronicles and real-world exposés.' },
  { id: 18, name: 'Drama', mediaType: 'tv', badge: 'PRESTIGE TELEVISION', description: 'Award-winning serialized drama with complex ensemble casts.' },
  { id: 10751, name: 'Family', mediaType: 'tv', badge: 'ALL AGES TELEVISION', description: 'Heartwarming narratives designed for shared viewing.' },
  { id: 10762, name: 'Kids', mediaType: 'tv', badge: 'YOUTH NARRATIVES', description: 'Curated adventures for young minds and curious dreamers.' },
  { id: 9648, name: 'Mystery', mediaType: 'tv', badge: 'SERIAL PUZZLES', description: 'Multi-episode whodunits that keep viewers theorizing.' },
  { id: 10763, name: 'News', mediaType: 'tv', badge: 'DISPATCHES & CURRENT', description: 'In-depth global reporting and journalistic broadcasts.' },
  { id: 10764, name: 'Reality', mediaType: 'tv', badge: 'UNSCRIPTED LIVES', description: 'High-stakes competition and real-world human dynamics.' },
  { id: 10765, name: 'Sci-Fi & Fantasy', mediaType: 'tv', badge: 'COSMIC & MYTHIC TV', description: 'World-building sagas, alternate dimensions, and arcane magic.' },
  { id: 10766, name: 'Soap', mediaType: 'tv', badge: 'DAILY CONTINUITY', description: 'Long-running multi-decade family dynasties and melodramas.' },
  { id: 10767, name: 'Talk', mediaType: 'tv', badge: 'CONVERSATIONS', description: 'Intimate celebrity interviews, panels, and late-night discourse.' },
  { id: 10768, name: 'War & Politics', mediaType: 'tv', badge: 'STATECRAFT & POWER', description: 'Cabinet intrigue, geopolitical diplomacy, and military campaigns.' },
  { id: 37, name: 'Western', mediaType: 'tv', badge: 'FRONTIER TELEVISION', description: 'Sweeping ranches, outlaw justice, and law on the frontier.' },
];

export const TMDB_GENRES: Genre[] = ALL_MOVIE_GENRES.map(g => ({ id: g.id, name: g.name }));

export function getPosterUrl(path: string | null, size: 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string {
  if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
  if (path.startsWith('http')) return path;
  return `/tmdb-img/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1400&auto=format&fit=crop';
  if (path.startsWith('http')) return path;
  return `/tmdb-img/${size}${path}`;
}

const defaultHeaders = {
  Authorization: `Bearer ${READ_TOKEN}`,
  'Content-Type': 'application/json',
};

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const isBrowser = typeof window !== 'undefined';
  const base = isBrowser ? '/tmdb-api' : 'https://api.themoviedb.org/3';
  const query = new URLSearchParams({ api_key: API_KEY, ...params });
  const url = `${base}${endpoint}?${query.toString()}`;

  let attempts = 0;
  const maxAttempts = 2;
  while (attempts < maxAttempts) {
    try {
      attempts++;
      const response = await fetch(url, {
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`TMDB HTTP error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      // Non-blocking automatic persistence of every TMDB API call to Neon DB
      try {
        const resultsCount = Array.isArray(json?.results) ? json.results.length : (json?.id ? 1 : 0);
        const preview = Array.isArray(json?.results) ? json.results.slice(0, 3) : json;
        logTMDBApiCall(endpoint, params, resultsCount, preview).catch(() => {});
      } catch (err) {
        // Silent fail so API calls never break if DB is unreachable
      }

      return json;
    } catch (err) {
      if (attempts >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

// Curated Masterpieces
export const CURATED_FALLBACK_FILMS: MediaItem[] = [
  {
    id: 693134,
    title: 'Dune: Part Two',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1400&auto=format&fit=crop',
    vote_average: 8.2,
    vote_count: 5800,
    release_date: '2024-02-27',
    media_type: 'movie',
    genre_ids: [878, 12],
    runtime: 166,
    tagline: 'Long live the fighters.',
    director: 'Denis Villeneuve',
    trailerKey: 'Way9Dexny3w',
    dominantColor: '#d97706',
    secondaryColor: '#b45309',
    popularity: 240,
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II, chronicling his turbulent leadership of the Manhattan Project.',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: '/rLb2cw69P71pmv01vA1FqVwJtJg.jpg',
    vote_average: 8.1,
    vote_count: 9200,
    release_date: '2023-07-19',
    media_type: 'movie',
    genre_ids: [18, 36],
    runtime: 180,
    tagline: 'The world forever changes.',
    director: 'Christopher Nolan',
    trailerKey: 'uYPbbksJxIg',
    dominantColor: '#ea580c',
    secondaryColor: '#c2410c',
    popularity: 220,
  },
  {
    id: 335984,
    title: 'Blade Runner 2049',
    overview: 'Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what\'s left of society into chaos.',
    poster_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1400&auto=format&fit=crop',
    vote_average: 8.0,
    vote_count: 12500,
    release_date: '2017-10-04',
    media_type: 'movie',
    genre_ids: [878, 9648],
    runtime: 164,
    tagline: 'The key to the future is finally unearthed.',
    director: 'Denis Villeneuve',
    trailerKey: 'gCcx85zbxz4',
    dominantColor: '#06b6d4',
    secondaryColor: '#0891b2',
    popularity: 190,
  },
  {
    id: 94605,
    title: 'Arcane',
    overview: 'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.',
    poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    backdrop_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1400&auto=format&fit=crop',
    vote_average: 9.0,
    vote_count: 3800,
    first_air_date: '2021-11-06',
    media_type: 'tv',
    genre_ids: [16, 10765, 18],
    runtime: 42,
    tagline: 'Every legend has a beginning.',
    director: 'Pascal Charrue, Arnaud Delord',
    trailerKey: 'fXmAurh012s',
    dominantColor: '#ec4899',
    secondaryColor: '#db2777',
    popularity: 210,
  },
  {
    id: 119051,
    title: 'Wednesday',
    overview: 'Wednesday Addams misadventures as a student at Nevermore Academy: a very unique boarding school in deepest New England.',
    poster_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=800&auto=format&fit=crop',
    backdrop_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1400&auto=format&fit=crop',
    vote_average: 8.4,
    vote_count: 8500,
    first_air_date: '2022-11-23',
    media_type: 'tv',
    genre_ids: [10765, 9648, 35],
    runtime: 45,
    tagline: 'A dreadfully delightful mystery.',
    director: 'Tim Burton',
    trailerKey: 'Di310BC8zMg',
    dominantColor: '#6366f1',
    secondaryColor: '#4f46e5',
    popularity: 220,
  },
  {
    id: 792307,
    title: 'Poor Things',
    overview: 'The incredible tale of the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.',
    poster_path: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop',
    backdrop_path: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1400&auto=format&fit=crop',
    vote_average: 7.7,
    vote_count: 4200,
    release_date: '2023-12-07',
    media_type: 'movie',
    genre_ids: [878, 10749, 35],
    runtime: 141,
    tagline: 'She\'s like nothing you\'ve ever seen.',
    director: 'Yorgos Lanthimos',
    trailerKey: 'RlbR5N6veqw',
    dominantColor: '#eab308',
    secondaryColor: '#ca8a04',
    popularity: 155,
  }
];

export async function fetchTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> {
  // DB-First: Return from Neon DB immediately if cached
  try {
    const cached = await getCachedMediaItems(80, undefined, mediaType === 'all' ? undefined : mediaType);
    if (cached && cached.length >= 10) {
      // Trigger background update silently to keep DB fresh
      fetchFromTMDB(`/trending/${mediaType}/${timeWindow}`)
        .then((data) => {
          if (data?.results?.length > 0) {
            const fresh = data.results.map((item: any) => normalizeTMDBItem(item, mediaType === 'all' ? (item.media_type || 'movie') : mediaType));
            saveMediaItemsBatch(fresh).catch(() => {});
          }
        })
        .catch(() => {});

      return cached;
    }
  } catch (e) {
    // Continue to TMDB API on DB miss
  }

  try {
    const data = await fetchFromTMDB(`/trending/${mediaType}/${timeWindow}`);
    if (data && data.results && data.results.length > 0) {
      const items = data.results.map((item: any) => normalizeTMDBItem(item, mediaType === 'all' ? (item.media_type || 'movie') : mediaType));
      saveMediaItemsBatch(items).catch(() => {});
      return items;
    }
  } catch (err) {
    console.warn('TMDB Trending fetch failed, using curated library:', err);
  }
  return CURATED_FALLBACK_FILMS;
}

export async function fetchTopRated(mediaType: MediaType = 'movie'): Promise<MediaItem[]> {
  try {
    const data = await fetchFromTMDB(`/${mediaType}/top_rated`);
    if (data && data.results && data.results.length > 0) {
      const items = data.results.map((item: any) => normalizeTMDBItem(item, mediaType));
      saveMediaItemsBatch(items).catch(() => {});
      return items;
    }
  } catch (err) {
    console.warn('TMDB Top Rated fetch failed:', err);
  }
  return CURATED_FALLBACK_FILMS;
}

/**
 * Fetch movies or TV series filtered by specific TMDB genre ID (DB-First)
 */
export async function fetchMediaByGenre(
  genreId: number, 
  mediaType: 'movie' | 'tv' = 'movie', 
  page: number = 1
): Promise<MediaItem[]> {
  // DB-First check
  try {
    const cached = await getCachedMediaItems(40, genreId, mediaType);
    if (cached && cached.length >= 6) {
      return cached;
    }
  } catch (e) {
    // Ignore and fetch from API
  }

  try {
    const data = await fetchFromTMDB(`/discover/${mediaType}`, {
      with_genres: String(genreId),
      sort_by: 'popularity.desc',
      include_adult: 'false',
      page: String(page),
    });

    if (data && data.results && data.results.length > 0) {
      const items = data.results
        .filter((item: any) => item.poster_path || item.backdrop_path)
        .map((item: any) => normalizeTMDBItem(item, mediaType));
      
      saveMediaItemsBatch(items).catch(() => {});
      return items;
    }
  } catch (err) {
    console.warn(`TMDB fetchMediaByGenre failed for ${mediaType} genre ${genreId}:`, err);
  }
  return [];
}

export async function searchTMDB(query: string, mediaType: 'all' | 'movie' | 'tv' = 'all'): Promise<MediaItem[]> {
  if (!query.trim()) return [];

  try {
    const endpoint = mediaType === 'all' ? '/search/multi' : `/search/${mediaType}`;
    const data = await fetchFromTMDB(endpoint, { query: query.trim() });
    if (data && data.results && data.results.length > 0) {
      const items = data.results
        .filter((item: any) => (item.media_type === 'movie' || item.media_type === 'tv' || mediaType !== 'all') && (item.poster_path || item.backdrop_path))
        .map((item: any) => normalizeTMDBItem(item, mediaType === 'all' ? (item.media_type || 'movie') : mediaType));
      
      if (items.length > 0) {
        // Actively store search results in Neon DB!
        await saveMediaItemsBatch(items);
        return items;
      }
    }
  } catch (err) {
    console.warn('TMDB Search failed, falling back to local DB cache:', err);
  }

  // Fallback to local DB cache if offline or network fails
  try {
    const dbMatches = await searchCachedMedia(query, 20);
    if (dbMatches && dbMatches.length > 0) {
      return dbMatches;
    }
  } catch (e) {}

  // Fallback search over local curated library
  const q = query.toLowerCase();
  return CURATED_FALLBACK_FILMS.filter((m) => m.title.toLowerCase().includes(q) || m.overview.toLowerCase().includes(q));
}

export async function fetchMediaDetails(id: number, mediaType: MediaType = 'movie'): Promise<Partial<MediaItem>> {
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}`, {
      append_to_response: 'videos,credits,similar',
    });

    const director = data.credits?.crew?.find((c: any) => c.job === 'Director')?.name ||
      data.created_by?.[0]?.name;

    const cast = (data.credits?.cast || []).slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path,
    }));

    // Find official YouTube trailer
    let trailerKey: string | null = null;
    const videos = data.videos?.results || [];
    const trailer = videos.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || videos[0];
    if (trailer) {
      trailerKey = trailer.key;
    }

    const details: Partial<MediaItem> = {
      runtime: data.runtime || (data.episode_run_time?.[0] ?? 50),
      tagline: data.tagline,
      director,
      cast,
      trailerKey,
      genres: data.genres,
    };

    // Actively update enriched details in Neon DB!
    updateMediaDetailsInDb(id, details).catch(() => {});

    return details;
  } catch (err) {
    console.warn(`TMDB Details fetch for ${mediaType} ${id} failed:`, err);
    return {};
  }
}

export function normalizeTMDBItem(item: any, mediaType: MediaType): MediaItem {
  const isMovie = (item.media_type || mediaType) === 'movie';
  const title = item.title || item.name || item.original_title || item.original_name || 'Untitled';

  return {
    id: item.id,
    title,
    original_title: item.original_title || item.original_name,
    overview: item.overview || 'No synopsis available.',
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: Number((item.vote_average || 7.5).toFixed(1)),
    vote_count: item.vote_count || 100,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    media_type: (item.media_type || mediaType) as MediaType,
    genre_ids: item.genre_ids || (item.genres ? item.genres.map((g: any) => g.id) : []),
    popularity: item.popularity,
  };
}
