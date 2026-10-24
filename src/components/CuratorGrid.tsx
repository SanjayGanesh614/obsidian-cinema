import React from 'react';
import { MediaItem } from '../types/cinema';
import { getPosterUrl } from '../services/tmdb';
import { formatReleaseYear } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { Star, Ticket, Bookmark, Check, Play, Info } from 'lucide-react';

interface CuratorGridProps {
  items: MediaItem[];
  watchlistIds: Set<number>;
  watchedIds: Set<number>;
  onSelect: (item: MediaItem) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  onStampTicket: (item: MediaItem) => void;
  onPlayTrailer: (item: MediaItem) => void;
  onHoverItem?: (item: MediaItem | null) => void;
}

export const CuratorGrid: React.FC<CuratorGridProps> = ({
  items,
  watchlistIds,
  watchedIds,
  onSelect,
  onToggleWatchlist,
  onStampTicket,
  onPlayTrailer,
  onHoverItem,
}) => {
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full glass-card mx-auto flex items-center justify-center text-white/40 mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h3 className="font-display text-xl text-white font-medium mb-1">No cinematic entries found</h3>
        <p className="text-white/50 text-sm max-w-sm mx-auto font-sans">
          Try adjusting your genre filters, search query, or watch status.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {items.map((item) => {
          const year = formatReleaseYear(item);
          const posterUrl = getPosterUrl(item.poster_path, 'w500');
          const isWatchlisted = watchlistIds.has(item.id);
          const isWatched = watchedIds.has(item.id);

          return (
            <div
              key={item.id}
              onMouseEnter={() => onHoverItem?.(item)}
              onMouseLeave={() => onHoverItem?.(null)}
              className="group relative flex flex-col rounded-2xl glass-card overflow-hidden glass-card-hover cursor-pointer"
            >
              {/* Poster Image with 3D Tilt Glint */}
              <div
                className="relative aspect-[2/3] w-full overflow-hidden bg-[#111116]"
                onClick={() => {
                  cinemaAudio.playClick();
                  onSelect(item);
                }}
              >
                <img
                  src={posterUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-108"
                />

                {/* Ambient dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090c] via-transparent to-transparent opacity-80" />

                {/* Rating Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full glass-panel border border-white/20 text-[11px] font-mono-code font-semibold text-amber-300 flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 fill-amber-300" />
                  <span>{item.vote_average.toFixed(1)}</span>
                </div>

                {/* Holographic foil glint on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 holographic-foil pointer-events-none transition-opacity duration-500" />

                {/* Quick Action Overlay on Hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 gap-2 backdrop-blur-[2px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cinemaAudio.playClick();
                      onPlayTrailer(item);
                    }}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                    title="Watch Trailer"
                  >
                    <Play className="w-4 h-4 fill-black translate-x-0.5" />
                  </button>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cinemaAudio.playClick();
                        onToggleWatchlist(item);
                      }}
                      className={`p-2 rounded-full glass-card border transition-all ${
                        isWatchlisted
                          ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                          : 'border-white/20 text-white hover:border-white'
                      }`}
                      title={isWatchlisted ? 'Remove Watchlist' : 'Add to Watchlist'}
                    >
                      {isWatchlisted ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cinemaAudio.playClick();
                        onStampTicket(item);
                      }}
                      className="p-2 rounded-full bg-amber-400 text-black hover:bg-amber-300 transition-all font-bold shadow-md shadow-amber-400/20"
                      title="Stamp 3D Ticket"
                    >
                      <Ticket className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Title & Metadata */}
              <div
                className="p-3.5 flex flex-col justify-between flex-grow"
                onClick={() => {
                  cinemaAudio.playClick();
                  onSelect(item);
                }}
              >
                <div>
                  <h3 className="font-display font-medium text-sm text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono-code text-white/50">
                    <span>{year}</span>
                    <span>·</span>
                    <span className="uppercase">{item.media_type}</span>
                  </div>
                </div>

                {isWatched && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono-code text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 w-fit">
                    <Ticket className="w-3 h-3" />
                    <span>Stamped</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
