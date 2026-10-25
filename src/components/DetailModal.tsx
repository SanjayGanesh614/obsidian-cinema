import React, { useEffect, useState } from 'react';
import { MediaItem } from '../types/cinema';
import { fetchMediaDetails, getBackdropUrl, getPosterUrl } from '../services/tmdb';
import { formatReleaseYear, formatRuntime, extractCinemaColor } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { X, Play, Bookmark, Check, Star, Film, User } from 'lucide-react';

interface DetailModalProps {
  item: MediaItem;
  isInWatchlist: boolean;
  isWatched: boolean;
  onClose: () => void;
  onToggleWatchlist: (item: MediaItem) => void;
  onToggleWatched: (item: MediaItem) => void;
  onPlayTrailer: (item: MediaItem) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  isInWatchlist,
  isWatched,
  onClose,
  onToggleWatchlist,
  onToggleWatched,
  onPlayTrailer,
}) => {
  const [enrichedItem, setEnrichedItem] = useState<MediaItem>(item);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchMediaDetails(item.id, item.media_type)
      .then((details) => {
        if (isMounted) {
          setEnrichedItem({
            ...item,
            ...details,
          });
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [item]);

  const year = formatReleaseYear(enrichedItem);
  const backdropUrl = getBackdropUrl(enrichedItem.backdrop_path, 'original');
  const posterUrl = getPosterUrl(enrichedItem.poster_path, 'w500');
  const colors = extractCinemaColor(enrichedItem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Dynamic ambient backdrop aura */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 blur-[120px]"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${colors.primary} 0%, transparent 70%)`,
        }}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl rounded-3xl glass-card overflow-hidden border border-white/15 shadow-2xl my-auto z-10 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            cinemaAudio.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white border border-white/15 transition-all shadow-lg"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Backdrop Header */}
          <div className="relative w-full h-64 sm:h-80 overflow-hidden bg-black">
            <img
              src={backdropUrl}
              alt={enrichedItem.title}
              className="w-full h-full object-cover object-center opacity-50 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e14] via-[#0e0e14]/50 to-transparent" />

            {/* Play Trailer Button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => {
                  cinemaAudio.playClick();
                  onPlayTrailer(enrichedItem);
                }}
                className="group flex items-center gap-3 px-6 py-3 rounded-full glass-panel border border-white/30 text-white font-display font-semibold text-sm hover:scale-105 transition-all shadow-2xl"
              >
                <div className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-black translate-x-0.5" />
                </div>
                <span>Play Official Trailer</span>
              </button>
            </div>
          </div>

          {/* Core Details Grid */}
          <div className="p-6 sm:p-8 -mt-20 relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Poster thumbnail */}
              <div className="w-32 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden glass-card p-1 shadow-2xl shrink-0 hidden sm:block">
                <img
                  src={posterUrl}
                  alt={enrichedItem.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* Title & Tagline & Metadata */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">
                    {enrichedItem.media_type === 'movie' ? 'Film' : 'TV Series'}
                  </span>
                  <span className="text-xs font-mono-code text-white/60">{year}</span>
                  {enrichedItem.runtime && (
                    <span className="text-xs font-mono-code text-white/60">
                      · {formatRuntime(enrichedItem.runtime)}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-amber-400 font-mono-code text-xs ml-auto">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-bold">{enrichedItem.vote_average.toFixed(1)}</span>
                    <span className="text-white/40">({enrichedItem.vote_count})</span>
                  </div>
                </div>

                <h2 className="font-cinzel text-2xl sm:text-4xl font-extrabold text-white">
                  {enrichedItem.title}
                </h2>

                {enrichedItem.tagline && (
                  <p className="font-display italic text-amber-300/80 text-sm sm:text-base">
                    "{enrichedItem.tagline}"
                  </p>
                )}

                {enrichedItem.director && (
                  <div className="flex items-center gap-2 text-xs font-mono-code text-white/70">
                    <span className="text-white/40">Directed by</span>
                    <span className="text-white font-medium">{enrichedItem.director}</span>
                  </div>
                )}

                {/* Genre chips */}
                {enrichedItem.genres && enrichedItem.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {enrichedItem.genres.map((g) => (
                      <span
                        key={g.id}
                        className="px-2.5 py-1 rounded-md text-xs font-mono-code bg-white/5 border border-white/10 text-white/80"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <h4 className="text-xs font-mono-code uppercase tracking-wider text-white/50 mb-2">
                SYNOPSIS & ARCHIVE LOG
              </h4>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed font-sans">
                {enrichedItem.overview}
              </p>
            </div>

            {/* Cast Members */}
            {enrichedItem.cast && enrichedItem.cast.length > 0 && (
              <div>
                <h4 className="text-xs font-mono-code uppercase tracking-wider text-white/50 mb-3">
                  PRINCIPAL CAST
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {enrichedItem.cast.slice(0, 5).map((cast) => (
                    <div
                      key={cast.id}
                      className="glass-card p-2.5 rounded-xl border border-white/10 flex items-center gap-2.5"
                    >
                      {cast.profile_path ? (
                        <img
                          src={getPosterUrl(cast.profile_path, 'w342')}
                          alt={cast.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-white/50" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-display font-medium text-white truncate">
                          {cast.name}
                        </p>
                        <p className="text-[10px] font-mono-code text-white/40 truncate">
                          {cast.character}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions Dock */}
        <div className="p-4 sm:p-6 glass-panel border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                cinemaAudio.playClick();
                onToggleWatchlist(enrichedItem);
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-display tracking-wider uppercase border transition-all flex items-center gap-2 ${
                isInWatchlist
                  ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                  : 'border-white/20 glass-card text-white hover:border-white'
              }`}
            >
              {isInWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              cinemaAudio.playClick();
              onToggleWatched(enrichedItem);
            }}
            className={`px-6 py-2.5 rounded-full font-display font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 ${
              isWatched
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black shadow-amber-500/25'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isWatched ? 'Watched ✓' : 'Mark Watched'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
