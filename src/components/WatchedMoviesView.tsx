import React, { useState, useMemo, useEffect } from 'react';
import { MediaItem, WatchedEntry } from '../types/cinema';
import { Masonry, MasonryItem } from './reactbits/Masonry';
import { mapMediaToMasonryItems, formatRuntime, formatReleaseYear, calculateWatchedStats } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { fetchMediaDetails, getBackdropUrl, getPosterUrl } from '../services/tmdb';
import { 
  CheckCircle2, 
  Film, 
  Tv, 
  Star, 
  Trash2, 
  Play, 
  Move, 
  X, 
  Calendar, 
  User,
  Quote,
  Edit3
} from 'lucide-react';

interface WatchedMoviesViewProps {
  watchedEntries: WatchedEntry[];
  allMedia: MediaItem[];
  onToggleWatched: (item: MediaItem) => void;
  onEditWatched?: (item: MediaItem) => void;
  onSelectMovie?: (item: MediaItem) => void;
  onPlayTrailer?: (item: MediaItem) => void;
  onClose?: () => void;
}

export const WatchedMoviesView: React.FC<WatchedMoviesViewProps> = ({
  watchedEntries,
  allMedia,
  onToggleWatched,
  onEditWatched,
  onSelectMovie,
  onPlayTrailer,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv' | 'top'>('all');
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [enrichedMedia, setEnrichedMedia] = useState<MediaItem | null>(null);

  const watchedIds = useMemo(() => new Set(watchedEntries.map((e) => e.mediaId)), [watchedEntries]);

  // Filter movies that user marked as watched
  const watchedMovies = useMemo(() => {
    return allMedia.filter((m) => watchedIds.has(m.id));
  }, [allMedia, watchedIds]);

  // Lookup active item's user rating and review
  const activeEntry = useMemo(() => {
    if (!activeItem) return null;
    return watchedEntries.find((e) => e.mediaId === activeItem.id) || null;
  }, [activeItem, watchedEntries]);

  // Fetch full details for selected watched title
  useEffect(() => {
    if (!activeItem) {
      setEnrichedMedia(null);
      return;
    }

    let isMounted = true;
    fetchMediaDetails(activeItem.id, activeItem.media_type)
      .then((details) => {
        if (isMounted) {
          setEnrichedMedia({
            ...activeItem,
            ...details,
          });
        }
      })
      .catch(() => {
        if (isMounted) setEnrichedMedia(activeItem);
      });

    return () => {
      isMounted = false;
    };
  }, [activeItem]);

  // Filtered list based on category tab
  const filteredMovies = useMemo(() => {
    let list = [...watchedMovies];
    if (filterType === 'movie') {
      list = list.filter((m) => m.media_type === 'movie');
    } else if (filterType === 'tv') {
      list = list.filter((m) => m.media_type === 'tv');
    } else if (filterType === 'top') {
      list = list.filter((m) => {
        const entry = watchedEntries.find((e) => e.mediaId === m.id);
        const score = entry ? entry.rating : m.vote_average / 2;
        return score >= 4.5;
      });
    }
    return list;
  }, [watchedMovies, filterType, watchedEntries]);

  // Aggregate stats using pure calculation
  const stats = useMemo(() => {
    return calculateWatchedStats(watchedMovies, watchedEntries);
  }, [watchedMovies, watchedEntries]);

  // Map to React Bits Masonry items with user ratings
  const masonryItems: MasonryItem[] = useMemo(() => {
    return mapMediaToMasonryItems(filteredMovies, watchedEntries);
  }, [filteredMovies, watchedEntries]);

  const handleTileClick = (item: MasonryItem) => {
    cinemaAudio.playClick();
    if (item.rawMedia) {
      setActiveItem(item.rawMedia);
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-fadeIn">
      {/* 1. Page Header with Cinematic Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Curated Personal Cinema Archive</span>
          </div>
          <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-white tracking-wide">
            My Watched Movies
          </h1>
          <p className="text-white/60 text-sm max-w-2xl font-sans">
            A fluid, interactive gallery of every film and series you've marked as watched. Click any title to view details, inspect your star rating, and read your personal review.
          </p>
        </div>

        {/* Telemetry Stats Strip */}
        <div className="flex items-center gap-3 sm:gap-6 p-4 rounded-2xl glass-card border border-white/15 bg-black/40 shadow-2xl shrink-0">
          <div>
            <div className="text-[10px] font-mono-code text-white/40 uppercase">Watched</div>
            <div className="text-xl sm:text-2xl font-bold font-cinzel text-amber-300">
              {stats.totalWatched}
            </div>
            <div className="text-[10px] font-mono-code text-white/40">
              {stats.movieCount} Films · {stats.tvCount} TV
            </div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div>
            <div className="text-[10px] font-mono-code text-white/40 uppercase">Avg Score</div>
            <div className="text-xl sm:text-2xl font-bold font-cinzel text-emerald-400 flex items-center gap-1">
              <Star className="w-4 h-4 fill-emerald-400" />
              <span>{stats.averageRating}</span>
            </div>
            <div className="text-[10px] font-mono-code text-white/40">Your Archive / 5.0</div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div>
            <div className="text-[10px] font-mono-code text-white/40 uppercase">Screen Time</div>
            <div className="text-xl sm:text-2xl font-bold font-cinzel text-cyan-300">
              {stats.totalRuntimeHours}h
            </div>
            <div className="text-[10px] font-mono-code text-white/40">Total Runtime</div>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl glass-card border border-white/10">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              cinemaAudio.playClick();
              setFilterType('all');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap transition-all ${
              filterType === 'all'
                ? 'bg-amber-400 text-black font-bold shadow-lg shadow-amber-400/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            All Watched ({watchedMovies.length})
          </button>
          <button
            onClick={() => {
              cinemaAudio.playClick();
              setFilterType('movie');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterType === 'movie'
                ? 'bg-amber-400 text-black font-bold shadow-lg shadow-amber-400/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Feature Films ({stats.movieCount})</span>
          </button>
          <button
            onClick={() => {
              cinemaAudio.playClick();
              setFilterType('tv');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterType === 'tv'
                ? 'bg-amber-400 text-black font-bold shadow-lg shadow-amber-400/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Series ({stats.tvCount})</span>
          </button>
          <button
            onClick={() => {
              cinemaAudio.playClick();
              setFilterType('top');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterType === 'top'
                ? 'bg-emerald-400 text-black font-bold shadow-lg shadow-emerald-400/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Top Rated (≥4.5★)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-code text-white/40 self-end sm:self-auto">
          <Move className="w-3.5 h-3.5 text-amber-400" />
          <span>Drag tiles to reorder · Click for details</span>
        </div>
      </div>

      {/* 3. React Bits <Masonry /> Component Grid */}
      <div className="relative w-full min-h-[500px]">
        {masonryItems.length > 0 ? (
          <Masonry
            items={masonryItems}
            columnWidth={260}
            gap={18}
            radius={16}
            animateFrom="bottom"
            stagger={0.04}
            hoverEffect="zoom"
            captions="hover"
            lightbox={false}
            draggable={true}
            onItemClick={handleTileClick}
            className="w-full"
          />
        ) : (
          <div className="py-24 text-center glass-card rounded-3xl border border-white/10 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-white/30 mx-auto" />
            <h3 className="font-cinzel text-xl text-white">No Watched Titles In This Category</h3>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              Mark titles as watched while browsing to build your personal fluid cinema wall.
            </p>
          </div>
        )}
      </div>

      {/* 4. Film Inspection Split Dialog with Rating & Review on the Right Side */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-5xl rounded-3xl glass-card overflow-hidden border border-white/20 shadow-2xl bg-[#0a0a0f] max-h-[90vh] flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => {
                cinemaAudio.playClick();
                setActiveItem(null);
              }}
              className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white border border-white/15 transition-all shadow-lg cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Split Dual-Panel Body */}
            <div className="overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
              
              {/* LEFT SIDE (7-8 cols): Movie Details & Trailer */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                {/* Backdrop Banner with Trailer Overlay */}
                <div className="relative w-full h-56 sm:h-72 bg-black overflow-hidden shrink-0">
                  <img
                    src={getBackdropUrl(activeItem.backdrop_path, 'original')}
                    alt={activeItem.title}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />

                  {/* Trailer Button Overlay */}
                  {onPlayTrailer && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={() => {
                          cinemaAudio.playClick();
                          onPlayTrailer(enrichedMedia || activeItem);
                        }}
                        className="group flex items-center gap-3 px-6 py-3 rounded-full glass-panel border border-white/30 text-white font-display font-semibold text-sm hover:scale-105 transition-all shadow-2xl cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-black translate-x-0.5" />
                        </div>
                        <span>Watch Trailer</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Details Content Area */}
                <div className="p-6 sm:p-8 space-y-6 flex-1">
                  <div className="flex gap-5 items-start">
                    {/* Poster Thumbnail */}
                    <img
                      src={getPosterUrl(activeItem.poster_path, 'w342')}
                      alt={activeItem.title}
                      className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-xl border border-white/15 shadow-2xl shrink-0"
                    />

                    {/* Metadata & Title */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15">
                          {activeItem.media_type === 'movie' ? 'Feature Film' : 'TV Series'}
                        </span>
                        <span className="text-xs font-mono-code text-white/50">{formatReleaseYear(activeItem)}</span>
                        {enrichedMedia?.runtime && (
                          <span className="text-xs font-mono-code text-white/50">
                            · {formatRuntime(enrichedMedia.runtime)}
                          </span>
                        )}
                        <span className="text-xs font-mono-code text-white/50">
                          · TMDB ★ {activeItem.vote_average.toFixed(1)}
                        </span>
                      </div>

                      <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white">
                        {activeItem.title}
                      </h2>

                      {enrichedMedia?.director && (
                        <p className="text-xs font-mono-code text-white/70">
                          <span className="text-white/40">Directed by </span>
                          <span className="text-white font-medium">{enrichedMedia.director}</span>
                        </p>
                      )}

                      {/* Genre Tags */}
                      {enrichedMedia?.genres && enrichedMedia.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {enrichedMedia.genres.map((g) => (
                            <span
                              key={g.id}
                              className="px-2 py-0.5 rounded-md text-[11px] font-mono-code bg-white/5 border border-white/10 text-white/70"
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Synopsis */}
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-mono-code uppercase tracking-wider text-white/40">
                      Synopsis
                    </h4>
                    <p className="text-white/80 text-sm leading-relaxed font-sans">
                      {enrichedMedia?.overview || activeItem.overview || 'No extended synopsis available.'}
                    </p>
                  </div>

                  {/* Principal Cast */}
                  {enrichedMedia?.cast && enrichedMedia.cast.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-mono-code uppercase tracking-wider text-white/40">
                        Principal Cast
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {enrichedMedia.cast.slice(0, 4).map((c) => (
                          <div
                            key={c.id}
                            className="glass-card p-2 rounded-xl border border-white/10 flex items-center gap-2"
                          >
                            {c.profile_path ? (
                              <img
                                src={getPosterUrl(c.profile_path, 'w342')}
                                alt={c.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-white/50" />
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-display font-medium text-white truncate">{c.name}</p>
                              <p className="text-[9px] font-mono-code text-white/40 truncate">{c.character}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE (4-5 cols): User's Star Rating, Watch Date & Written Review */}
              <div className="lg:col-span-5 xl:col-span-4 p-6 sm:p-7 flex flex-col justify-between bg-black/40 space-y-6">
                <div className="space-y-6">
                  {/* Watched Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono-code font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Watched & Reviewed</span>
                    </div>

                    {onEditWatched && (
                      <button
                        onClick={() => {
                          cinemaAudio.playClick();
                          onEditWatched(activeItem);
                          setActiveItem(null);
                        }}
                        className="text-xs font-mono-code text-amber-400 hover:text-amber-300 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-amber-400/10 transition-colors cursor-pointer"
                        title="Edit your rating and review"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {/* 1. Rating display out of 5 */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono-code uppercase text-white/40 tracking-wider">
                      Your Rating (Out of 5)
                    </span>
                    <div className="flex items-center gap-1.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-5 h-5 ${
                            starIdx <= Math.round(activeEntry?.rating ?? 5.0)
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                              : 'text-white/20'
                          }`}
                        />
                      ))}
                      <span className="font-cinzel font-bold text-lg text-white ml-2">
                        {activeEntry?.rating ? `${activeEntry.rating.toFixed(1)} / 5.0` : '5.0 / 5.0'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Watched Date */}
                  <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-2 text-xs font-mono-code">
                    <div className="flex items-center gap-2 text-white/70">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        Watched on: <strong className="text-white">{activeEntry?.watchDate || 'Recently'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 3. Personal Notes & Review */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono-code uppercase text-white/40 tracking-wider">
                      <Quote className="w-3 h-3 text-amber-400" />
                      <span>Your Review & Thoughts</span>
                    </div>
                    <div className="p-4 rounded-2xl glass-card border border-white/15 bg-white/[0.03] text-sm text-white/90 leading-relaxed italic font-serif min-h-[90px]">
                      {activeEntry?.review ? (
                        `"${activeEntry.review}"`
                      ) : (
                        <span className="text-white/40 not-italic font-sans text-xs">
                          No written review added. Click "Edit" above to record your thoughts.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Delete / Remove */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => {
                      cinemaAudio.playClick();
                      onToggleWatched(activeItem);
                      setActiveItem(null);
                    }}
                    className="text-xs font-mono-code text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from Watched</span>
                  </button>

                  <span className="text-[10px] font-mono-code text-white/30">
                    ID #{activeItem.id}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
