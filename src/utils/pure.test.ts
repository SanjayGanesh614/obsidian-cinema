import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatReleaseYear,
  formatRuntime,
  generateTicketBarcode,
  filterAndSortMedia,
  calculateVaultStats,
  extractCinemaColor,
  mapMediaToFlexCarouselItems,
  mapTicketsToMasonryItems,
  dampSpringStep,
} from './pure';
import { MediaItem, FilterState, TicketStub } from '../types/cinema';

test('formatReleaseYear handles valid, missing and first_air_date', () => {
  assert.equal(formatReleaseYear({ release_date: '2024-03-01' }), '2024');
  assert.equal(formatReleaseYear({ first_air_date: '2019-10-15' }), '2019');
  assert.equal(formatReleaseYear({}), 'TBA');
});

test('formatRuntime converts minutes to hours and minutes', () => {
  assert.equal(formatRuntime(166), '2h 46m');
  assert.equal(formatRuntime(45), '45m');
  assert.equal(formatRuntime(120), '2h 0m');
  assert.equal(formatRuntime(undefined), '2h 14m');
});

test('generateTicketBarcode creates formatted unique barcode', () => {
  const barcode = generateTicketBarcode(693134, '2026-10-23');
  assert.equal(barcode, 'OBSIDIAN-693134-20261023');
});

test('filterAndSortMedia filters by search query, mediaType, watchStatus and sorts', () => {
  const items: MediaItem[] = [
    {
      id: 1,
      title: 'Dune: Part Two',
      overview: 'Paul Atreides unites with Chani.',
      poster_path: '/dune.jpg',
      backdrop_path: '/dune_bg.jpg',
      vote_average: 8.6,
      vote_count: 5000,
      release_date: '2024-03-01',
      media_type: 'movie',
      genre_ids: [12, 878],
    },
    {
      id: 2,
      title: 'Severance',
      overview: 'Mark leads a team of office workers.',
      poster_path: '/sev.jpg',
      backdrop_path: '/sev_bg.jpg',
      vote_average: 8.7,
      vote_count: 2200,
      first_air_date: '2022-02-18',
      media_type: 'tv',
      genre_ids: [18, 878],
    },
    {
      id: 3,
      title: 'Past Lives',
      overview: 'Nora and Hae Sung deeply connected childhood friends.',
      poster_path: '/past.jpg',
      backdrop_path: '/past_bg.jpg',
      vote_average: 7.9,
      vote_count: 1400,
      release_date: '2023-06-02',
      media_type: 'movie',
      genre_ids: [18, 10749],
    },
  ];

  const watchlist = new Set<number>([1]);
  const watched = new Set<number>([3]);

  // Search filter
  const searchFilter: FilterState = {
    searchQuery: 'dune',
    genreId: 'all',
    mediaType: 'all',
    watchStatus: 'all',
    sortBy: 'popularity',
  };
  const searchRes = filterAndSortMedia(items, searchFilter, watchlist, watched);
  assert.equal(searchRes.length, 1);
  assert.equal(searchRes[0].title, 'Dune: Part Two');

  // Watchlist filter
  const watchlistFilter: FilterState = {
    searchQuery: '',
    genreId: 'all',
    mediaType: 'all',
    watchStatus: 'watchlist',
    sortBy: 'popularity',
  };
  const wlRes = filterAndSortMedia(items, watchlistFilter, watchlist, watched);
  assert.equal(wlRes.length, 1);
  assert.equal(wlRes[0].id, 1);

  // Sort by rating
  const sortRatingFilter: FilterState = {
    searchQuery: '',
    genreId: 'all',
    mediaType: 'all',
    watchStatus: 'all',
    sortBy: 'rating',
  };
  const sortRes = filterAndSortMedia(items, sortRatingFilter, watchlist, watched);
  assert.equal(sortRes[0].id, 2); // Severance (8.7)
  assert.equal(sortRes[1].id, 1); // Dune (8.6)
  assert.equal(sortRes[2].id, 3); // Past Lives (7.9)
});

test('calculateVaultStats calculates correct aggregated metrics', () => {
  const sampleTickets: TicketStub[] = [
    {
      id: 't1',
      mediaId: 101,
      title: 'Oppenheimer',
      year: '2023',
      posterPath: '/opp.jpg',
      backdropPath: null,
      watchDate: '2026-08-14',
      rating: 5,
      review: 'Stunning cinematography.',
      theatre: 'BFI IMAX London',
      seat: 'Row H Seat 12',
      finish: 'iridescent',
      barcode: 'OBS-001',
      mediaType: 'movie',
      runtime: 180,
      createdAt: 1000,
    },
    {
      id: 't2',
      mediaId: 102,
      title: 'Blade Runner 2049',
      year: '2017',
      posterPath: '/br.jpg',
      backdropPath: null,
      watchDate: '2026-09-01',
      rating: 4.8,
      review: 'Masterpiece of modern sci-fi.',
      theatre: 'Alamo Drafthouse',
      seat: 'Row D Seat 6',
      finish: 'onyx_chrome',
      barcode: 'OBS-002',
      mediaType: 'movie',
      runtime: 164,
      createdAt: 2000,
    },
  ];

  const stats = calculateVaultStats(sampleTickets);
  assert.equal(stats.totalTickets, 2);
  assert.equal(stats.averageRating, 4.9);
  assert.equal(stats.totalRuntimeHours, 5.7);
});

test('extractCinemaColor assigns distinct cinematic palettes', () => {
  const duneColor = extractCinemaColor({
    id: 1,
    title: 'Dune: Part Two',
    overview: '',
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.5,
    vote_count: 100,
    media_type: 'movie',
    genre_ids: [12, 878],
  });
  assert.ok(duneColor.primary);
  assert.ok(duneColor.glow.startsWith('rgba'));
});

test('mapMediaToFlexCarouselItems formats items for WebGL FlexCarousel', () => {
  const mockMedia: MediaItem[] = [
    {
      id: 999,
      title: 'Solaris',
      overview: 'A psychologist is sent to a space station.',
      poster_path: '/solaris.jpg',
      backdrop_path: null,
      vote_average: 8.1,
      vote_count: 800,
      release_date: '1972-03-20',
      media_type: 'movie',
      genre_ids: [878, 18],
    },
  ];
  const items = mapMediaToFlexCarouselItems(mockMedia);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Solaris');
  assert.ok(items[0].subtitle.includes('1972'));
  assert.ok(items[0].subtitle.includes('★ 8.1'));
  assert.equal(items[0].movie.id, 999);
});

test('mapTicketsToMasonryItems formats watched tickets for React Bits Masonry', () => {
  const mockTickets: TicketStub[] = [
    {
      id: 't-1',
      mediaId: 101,
      title: 'Stalker',
      year: '1979',
      posterPath: '/stalker.jpg',
      backdropPath: '/stalker_bg.jpg',
      watchDate: '2026-10-20',
      rating: 5.0,
      review: 'Poetic masterpiece.',
      theatre: 'Arthouse',
      seat: 'Row 4',
      finish: 'onyx_chrome',
      barcode: 'OBS-101',
      mediaType: 'movie',
      createdAt: 1700000000,
    },
  ];
  const masonry = mapTicketsToMasonryItems(mockTickets);
  assert.equal(masonry.length, 1);
  assert.equal(masonry[0].id, 't-1');
  assert.equal(masonry[0].title, 'Stalker');
  assert.ok(masonry[0].description.includes('5.0'));
  assert.ok(masonry[0].width > 0);
  assert.ok(masonry[0].height > 0);
});

test('dampSpringStep smoothly converges towards target without overshooting', () => {
  let val = 0;
  const target = 100;
  const tau = 0.12;
  const dt = 0.016; // ~60fps frame

  for (let i = 0; i < 30; i++) {
    val = dampSpringStep(val, target, tau, dt);
  }
  // After 30 frames (0.48s), should have smoothly converged close to 100
  assert.ok(val > 95, `Expected val > 95, got ${val}`);
  assert.ok(val <= 100, `Expected val <= 100, got ${val}`);
});

