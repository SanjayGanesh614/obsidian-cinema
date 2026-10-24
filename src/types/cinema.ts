export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface MediaItem {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  media_type: MediaType;
  genre_ids: number[];
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
  director?: string;
  cast?: CastMember[];
  trailerKey?: string | null;
  dominantColor?: string;
  secondaryColor?: string;
  popularity?: number;
}

export type HolographicFinish = 'iridescent' | 'gold_leaf' | 'onyx_chrome' | 'emerald_noir';

export interface TicketStub {
  id: string;
  mediaId: number;
  title: string;
  year: string;
  posterPath: string | null;
  backdropPath: string | null;
  watchDate: string;
  rating: number; // 1 to 5 stars or 1 to 10
  review: string;
  theatre: string;
  seat: string;
  finish: HolographicFinish;
  barcode: string;
  mediaType: MediaType;
  runtime?: number;
  createdAt: number;
}

export type ViewMode = 'landing' | 'moods' | 'genres' | 'watched' | 'vault';

export interface MoodCategory {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  secondaryColor: string;
  badge: string;
  sampleIds: number[];
}

export type WatchStatusFilter = 'all' | 'watchlist' | 'watched';

export type SortOption = 'popularity' | 'rating' | 'release' | 'title';

export interface FilterState {
  searchQuery: string;
  genreId: number | 'all';
  mediaType: 'all' | 'movie' | 'tv';
  watchStatus: WatchStatusFilter;
  sortBy: SortOption;
  curationMood?: string;
}
