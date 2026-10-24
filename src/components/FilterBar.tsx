import React from 'react';
import { FilterState, SortOption, WatchStatusFilter } from '../types/cinema';
import { TMDB_GENRES } from '../services/tmdb';
import { cinemaAudio } from '../services/audio';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChangeFilters: (newFilters: FilterState) => void;
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  totalResults,
}) => {
  const curationMoods = [
    { label: 'All Curated', genreId: 'all' as const },
    { label: 'Sci-Fi', genreId: 878 },
    { label: 'Drama', genreId: 18 },
    { label: 'Thriller', genreId: 53 },
    { label: 'Crime', genreId: 80 },
    { label: 'Adventure', genreId: 12 },
    { label: 'Romance', genreId: 10749 },
    { label: 'Horror', genreId: 27 },
  ];

  const handleMoodSelect = (genreId: number | 'all') => {
    cinemaAudio.playClick();
    onChangeFilters({ ...filters, genreId });
  };

  const handleMediaTypeChange = (mediaType: 'all' | 'movie' | 'tv') => {
    cinemaAudio.playClick();
    onChangeFilters({ ...filters, mediaType });
  };

  const handleStatusChange = (watchStatus: WatchStatusFilter) => {
    cinemaAudio.playClick();
    onChangeFilters({ ...filters, watchStatus });
  };

  const handleSortChange = (sortBy: SortOption) => {
    cinemaAudio.playClick();
    onChangeFilters({ ...filters, sortBy });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        {/* Genre / Mood Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {curationMoods.map((m) => (
            <button
              key={String(m.genreId)}
              onClick={() => handleMoodSelect(m.genreId)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono-code whitespace-nowrap transition-all ${
                filters.genreId === m.genreId
                  ? 'bg-amber-400 text-black font-semibold shadow-md shadow-amber-400/20'
                  : 'glass-card text-white/70 hover:text-white hover:border-white/20'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Secondary controls: Media type & Watch Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Media Type Toggle */}
          <div className="flex items-center p-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono-code">
            {(['all', 'movie', 'tv'] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleMediaTypeChange(type)}
                className={`px-3 py-1 rounded-full transition-all uppercase ${
                  filters.mediaType === type
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {type === 'all' ? 'All' : type === 'movie' ? 'Movies' : 'TV'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center p-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono-code">
            {(['all', 'watchlist', 'watched'] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1 rounded-full transition-all uppercase ${
                  filters.watchStatus === status
                    ? 'bg-amber-400/20 text-amber-300 font-medium'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 glass-card px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono-code text-white/70">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="popularity" className="bg-[#121216] text-white">Most Popular</option>
              <option value="rating" className="bg-[#121216] text-white">Highest Rated</option>
              <option value="release" className="bg-[#121216] text-white">Release Year</option>
              <option value="title" className="bg-[#121216] text-white">Title (A-Z)</option>
            </select>
          </div>

          <span className="text-xs font-mono-code text-white/40">
            {totalResults} titles
          </span>
        </div>
      </div>
    </div>
  );
};
