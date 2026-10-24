import { TicketStub } from '../types/cinema';
import { generateTicketBarcode } from '../utils/pure';

const STORAGE_KEY_WATCHLIST = 'obsidian_watchlist_v1';
const STORAGE_KEY_TICKETS = 'obsidian_tickets_v1';

// Initial pre-stamped luxury holographic ticket stubs for immediate tactile experience
export const INITIAL_TICKETS: TicketStub[] = [
  {
    id: 'ticket-dune-2',
    mediaId: 693134,
    title: 'Dune: Part Two',
    year: '2024',
    posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropPath: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1400&auto=format&fit=crop',
    watchDate: '2026-03-01',
    rating: 5.0,
    review: 'Monolithic sound design, religious ecstasy in visual form. The spice was palpable in 70mm IMAX.',
    theatre: 'BFI IMAX London',
    seat: 'PREMIUM ROW J · SEAT 18',
    finish: 'gold_leaf',
    barcode: generateTicketBarcode(693134, '2026-03-01'),
    mediaType: 'movie',
    runtime: 166,
    createdAt: 1709280000000,
  },
  {
    id: 'ticket-oppenheimer',
    mediaId: 872585,
    title: 'Oppenheimer',
    year: '2023',
    posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropPath: '/rLb2cw69P71pmv01vA1FqVwJtJg.jpg',
    watchDate: '2026-07-21',
    rating: 4.9,
    review: 'The Trinity sequence vacuum of silence took the breath out of the entire theatre. Nolan at his zenith.',
    theatre: 'Lincoln Square AMC 70mm',
    seat: 'LOGE CENTER · SEAT 09',
    finish: 'onyx_chrome',
    barcode: generateTicketBarcode(872585, '2026-07-21'),
    mediaType: 'movie',
    runtime: 180,
    createdAt: 1721520000000,
  },
  {
    id: 'ticket-past-lives',
    mediaId: 666277,
    title: 'Past Lives',
    year: '2023',
    posterPath: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
    backdropPath: '/5YZbUmjbMa3ClvSW1Wj3D6XGolb.jpg',
    watchDate: '2026-06-12',
    rating: 4.8,
    review: 'The lingering pause before the cab arrives shattered my heart. Sublime, patient framing.',
    theatre: 'Film Forum NYC',
    seat: 'ORCHESTRA ROW D · SEAT 04',
    finish: 'iridescent',
    barcode: generateTicketBarcode(666277, '2026-06-12'),
    mediaType: 'movie',
    runtime: 106,
    createdAt: 1718150400000,
  },
];

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

export function getStoredTickets(): TicketStub[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TICKETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load tickets from localStorage', e);
  }
  return INITIAL_TICKETS;
}

export function saveTickets(tickets: TicketStub[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
  } catch (e) {
    console.warn('Failed to save tickets to localStorage', e);
  }
}
