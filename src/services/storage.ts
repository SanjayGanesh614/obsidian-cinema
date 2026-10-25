import { MediaItem, WatchedEntry } from '../types/cinema';

const STORAGE_KEY_WATCHLIST = 'obsidian_watchlist_v1';
const STORAGE_KEY_WATCHED = 'obsidian_watched_v2';

export function getStoredWatchlist(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WATCHLIST);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load watchlist from localStorage', e);
  }
  return [335984, 157336, 110492]; // Pre-saved Blade Runner 2049, Interstellar, Severance
}

export function saveWatchlist(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(ids));
  } catch (e) {
    console.warn('Failed to save watchlist to localStorage', e);
  }
}

export const INITIAL_WATCHED_ENTRIES: WatchedEntry[] = [
  {
    mediaId: 693134,
    rating: 5.0,
    review: 'Monolithic sound design, religious ecstasy in visual form. The spice was palpable in 70mm IMAX.',
    watchDate: '2026-03-01',
  },
  {
    mediaId: 872585,
    rating: 4.9,
    review: 'The Trinity sequence vacuum of silence took the breath out of the entire theatre. Nolan at his zenith.',
    watchDate: '2026-07-21',
  },
  {
    mediaId: 666277,
    rating: 4.8,
    review: 'The lingering pause before the cab arrives shattered my heart. Sublime, patient framing.',
    watchDate: '2026-06-12',
  },
  {
    mediaId: 335984,
    rating: 5.0,
    review: 'Atmospheric masterclass. Deakins cinematography and Zimmer wall-of-sound synth.',
    watchDate: '2026-05-18',
  },
];

export function getStoredWatched(): WatchedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WATCHED);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'number') {
          return parsed.map((id: number) => ({
            mediaId: id,
            rating: 5.0,
            review: '',
            watchDate: new Date().toISOString().slice(0, 10),
          }));
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load watched movies from localStorage', e);
  }
  return INITIAL_WATCHED_ENTRIES;
}

export function saveWatched(entries: WatchedEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY_WATCHED, JSON.stringify(entries));
  } catch (e) {
    console.warn('Failed to save watched movies to localStorage', e);
  }
}

const STORAGE_KEY_CACHED_MEDIA = 'obsidian_cached_media_v1';

export function getStoredMedia(): MediaItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHED_MEDIA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load media cache from localStorage', e);
  }
  return null;
}

export function saveStoredMedia(items: MediaItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CACHED_MEDIA, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save media cache to localStorage', e);
  }
}

