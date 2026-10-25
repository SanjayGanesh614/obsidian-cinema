import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '../types/cinema';
import { searchTMDB, getPosterUrl } from '../services/tmdb';
import { formatReleaseYear } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { Search, X, Star, Bookmark, Check, Film, Tv } from 'lucide-react';

interface SearchBarModalProps {
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  onToggleWatched: (item: MediaItem) => void;
  watchlistIds: Set<number>;
  watchedIds: Set<number>;
  onResultsFetched?: (items: MediaItem[]) => void;
}

export const SearchBarModal: React.FC<SearchBarModalProps> = ({
  onClose,
  onSelect,
  onToggleWatchlist,
  onToggleWatched,
  watchlistIds,
  watchedIds,
  onResultsFetched,
}) => {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv'>('all');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let isCurrent = true;

    const timer = setTimeout(() => {
      searchTMDB(query, mediaType)
        .then((items) => {
          if (!isCurrent) return;
          setResults(items);
          if (items && items.length > 0 && onResultsFetched) {
            onResultsFetched(items);
          }
          setLoading(false);
        })
        .catch(() => {
          if (!isCurrent) return;
          setLoading(false);
        });
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query, mediaType]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl glass-card overflow-hidden border border-white/20 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 glass-panel border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search films, series, directors, or keywords..."
            className="w-full bg-transparent text-base sm:text-lg text-white placeholder-white/40 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Media filter toggle */}
          <div className="hidden sm:flex items-center p-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono-code shrink-0">
            {(['all', 'movie', 'tv'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  cinemaAudio.playClick();
                  setMediaType(t);
                }}
                className={`px-2.5 py-1 rounded-full uppercase transition-all ${
                  mediaType === t
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              cinemaAudio.playClick();
              onClose();
            }}
            className="p-2 rounded-full glass-card hover:border-white/30 text-white/60 hover:text-white transition-all shrink-0"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/50">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono-code tracking-wider uppercase">Querying TMDB live database...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((item) => {
              const year = formatReleaseYear(item);
              const posterUrl = getPosterUrl(item.poster_path, 'w342');
              const isWatchlisted = watchlistIds.has(item.id);
              const isWatched = watchedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    cinemaAudio.playClick();
                    onSelect(item);
                    onClose();
                  }}
                  className="group p-3 rounded-2xl glass-card hover:border-white/30 transition-all flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <img
                      src={posterUrl}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded-lg shrink-0 bg-[#121216]"
                    />
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-medium text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-mono-code text-white/40 uppercase shrink-0">
                          {item.media_type === 'movie' ? <Film className="w-3 h-3 inline" /> : <Tv className="w-3 h-3 inline" />} {year}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-1 font-sans mt-0.5">
                        {item.overview}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] font-mono-code text-amber-400 mt-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{item.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        cinemaAudio.playClick();
                        onToggleWatchlist(item);
                      }}
                      className={`p-2 rounded-full glass-card border transition-all ${
                        isWatchlisted
                          ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                          : 'border-white/10 text-white/70 hover:text-white'
                      }`}
                      title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                    >
                      {isWatchlisted ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => {
                        cinemaAudio.playClick();
                        onToggleWatched(item);
                      }}
                      className={`p-2 rounded-full transition-all ${
                        isWatched
                          ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                          : 'bg-amber-400 text-black hover:bg-amber-300 font-bold'
                      }`}
                      title={isWatched ? 'Watched ✓' : 'Mark Watched'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : query ? (
            <div className="py-12 text-center text-white/50 text-sm font-sans">
              No matching titles found for "{query}".
            </div>
          ) : (
            <div className="py-8 text-center text-white/40 text-xs font-mono-code uppercase tracking-wider">
              Type to query live TMDB cinema archive
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
