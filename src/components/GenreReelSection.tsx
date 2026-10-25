import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MediaItem } from '../types/cinema';
import { 
  ALL_MOVIE_GENRES, 
  ALL_TV_GENRES, 
  FullGenre, 
  fetchMediaByGenre, 
  getPosterUrl,
  CURATED_FALLBACK_FILMS 
} from '../services/tmdb';
import { getNeonDbStats } from '../services/neonDb';
import { formatReleaseYear } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { OptionWheel } from './reactbits/OptionWheel';
import { FlexCarousel, FlexCarouselItem } from './reactbits/FlexCarousel';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Play, 
  Check, 
  Sparkles, 
  Film, 
  Tv, 
  Flame, 
  Database, 
  RefreshCw,
  Search,
  Layers,
  Info,
  Disc3,
  Sliders
} from 'lucide-react';

interface GenreReelSectionProps {
  items: MediaItem[];
  onSelectMovie: (item: MediaItem) => void;
  onPlayTrailer: (item: MediaItem) => void;
  onToggleWatched: (item: MediaItem) => void;
}

export const GenreReelSection: React.FC<GenreReelSectionProps> = ({
  items,
  onSelectMovie,
  onPlayTrailer,
  onToggleWatched,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbStats, setDbStats] = useState<{ mediaCount: number; logsCount: number }>({ mediaCount: 0, logsCount: 0 });
  const [isSyncing, setIsSyncing] = useState(false);

  // Filtered genre list based on movie/tv switch
  const activeGenresList = useMemo(() => {
    let list: FullGenre[] = [];
    if (filterType === 'all') {
      list = [...ALL_MOVIE_GENRES, ...ALL_TV_GENRES];
    } else if (filterType === 'movie') {
      list = ALL_MOVIE_GENRES;
    } else {
      list = ALL_TV_GENRES;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.badge.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filterType, searchQuery]);

  // Selected genre index for OptionWheel
  const [selectedWheelIndex, setSelectedWheelIndex] = useState(0);

  // Active genre object
  const currentGenre = useMemo(() => {
    if (activeGenresList.length === 0) return ALL_MOVIE_GENRES[0];
    const safeIdx = Math.min(Math.max(0, selectedWheelIndex), activeGenresList.length - 1);
    return activeGenresList[safeIdx];
  }, [activeGenresList, selectedWheelIndex]);

  // Titles for the current active genre
  const [genreTitles, setGenreTitles] = useState<MediaItem[]>([]);
  const [loadingCarousel, setLoadingCarousel] = useState(false);
  const [activeCenterMovie, setActiveCenterMovie] = useState<MediaItem | null>(null);

  // Fetch genre media whenever active genre changes
  useEffect(() => {
    if (!currentGenre) return;

    let isMounted = true;
    setLoadingCarousel(true);

    // Filter existing items or fetch live from TMDB
    const existing = items.filter(
      (m) => m.genre_ids?.includes(currentGenre.id) && (currentGenre.mediaType === 'both' || m.media_type === currentGenre.mediaType)
    );

    fetchMediaByGenre(currentGenre.id, currentGenre.mediaType as 'movie' | 'tv')
      .then((res) => {
        if (!isMounted) return;
        if (res && res.length > 0) {
          setGenreTitles(res);
          setActiveCenterMovie(res[0]);
        } else if (existing.length > 0) {
          setGenreTitles(existing);
          setActiveCenterMovie(existing[0]);
        } else {
          setGenreTitles(CURATED_FALLBACK_FILMS.slice(0, 8));
          setActiveCenterMovie(CURATED_FALLBACK_FILMS[0]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setGenreTitles(existing.length > 0 ? existing : CURATED_FALLBACK_FILMS.slice(0, 8));
      })
      .finally(() => {
        if (isMounted) setLoadingCarousel(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentGenre, items]);

  // Option wheel items (genre names)
  const wheelLabels = useMemo(() => {
    return activeGenresList.map((g) => g.name);
  }, [activeGenresList]);

  // Convert current genre movies to FlexCarouselItem format
  const flexItems: FlexCarouselItem[] = useMemo(() => {
    if (genreTitles.length === 0) {
      return CURATED_FALLBACK_FILMS.slice(0, 6).map((m) => ({
        src: getPosterUrl(m.poster_path, 'w500'),
        alt: m.overview,
        title: m.title,
        subtitle: `${formatReleaseYear(m)} · ★ ${m.vote_average?.toFixed(1) || '8.0'} · ${(m.media_type || 'movie').toUpperCase()}`,
        movie: m,
      }));
    }

    return genreTitles.map((movie) => ({
      src: getPosterUrl(movie.poster_path, 'w500'),
      alt: movie.overview,
      title: movie.title,
      subtitle: `${formatReleaseYear(movie)} · ★ ${movie.vote_average?.toFixed(1) || '8.0'} · ${(movie.media_type || 'movie').toUpperCase()}`,
      movie,
    }));
  }, [genreTitles]);

  // Load Neon DB stats
  const refreshDbStats = useCallback(() => {
    getNeonDbStats().then(setDbStats).catch(() => {});
  }, []);

  useEffect(() => {
    refreshDbStats();
    const interval = setInterval(refreshDbStats, 8000);
    return () => clearInterval(interval);
  }, [refreshDbStats]);

  const handleWheelChange = (index: number) => {
    cinemaAudio.playClick();
    setSelectedWheelIndex(index);
  };

  const handleCarouselChange = (index: number, item: any) => {
    if (item?.movie) {
      setActiveCenterMovie(item.movie);
    }
  };

  const handleCarouselSelect = (index: number, item: any) => {
    cinemaAudio.playClick();
    if (item?.movie) {
      onSelectMovie(item.movie);
    }
  };

  const syncAllGenresNow = async () => {
    cinemaAudio.playClick();
    setIsSyncing(true);
    try {
      const sample = ALL_MOVIE_GENRES.slice(0, 5);
      for (const g of sample) {
        await fetchMediaByGenre(g.id, 'movie');
      }
      refreshDbStats();
    } catch (e) {
      // Ignored
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-3 sm:px-8 py-8 space-y-8">
      {/* 1. Header & Neon DB Realtime Status Panel */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-widest">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Interactive WebGL 3D Cinema Vault</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-black text-white tracking-wide">
            Architectural Genre Reels
          </h2>
          <p className="text-white/60 text-sm max-w-2xl font-sans">
            Spin the 3D Option Wheel on the left to navigate every film and television genre. Experience each genre via the WebGL liquid flex carousel with dynamic curvature and focal depth.
          </p>
        </div>

        {/* Live Neon DB Telemetry Badge */}
        <div className="glass-card p-3 sm:p-4 rounded-2xl border border-white/15 bg-black/40 flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code font-bold text-white tracking-wide">Neon Serverless DB</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="text-[10px] font-mono-code text-white/50">
                Project: <span className="text-emerald-300">sparkling-morning-35513231</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-4 text-xs font-mono-code">
            <div>
              <div className="text-[10px] text-white/40 uppercase">Cached Media</div>
              <div className="text-sm font-bold text-amber-300">{dbStats.mediaCount} Titles</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase">TMDB API Logs</div>
              <div className="text-sm font-bold text-cyan-300">{dbStats.logsCount} Calls</div>
            </div>
            <button
              onClick={syncAllGenresNow}
              disabled={isSyncing}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all ml-1 disabled:opacity-50"
              title="Trigger Background DB Sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Format Switcher & Quick Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl glass-card border border-white/10">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 w-full sm:w-auto">
          <button
            onClick={() => {
              cinemaAudio.playClick();
              setFilterType('all');
              setSelectedWheelIndex(0);
            }}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-mono-code transition-all ${
              filterType === 'all'
                ? 'bg-amber-400 text-black font-bold shadow-lg shadow-amber-400/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            All Genres ({ALL_MOVIE_GENRES.length + ALL_TV_GENRES.length})
          </button>
          <button
            onClick={() => {
              cinemaAudio.playClick();
              setFilterType('movie');
              setSelectedWheelIndex(0);
            }}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-mono-code transition-all flex items-center justify-center gap-1.5 ${
              filterType === 'movie'
                ? 'bg-amber-400 text-black font-bold shadow-lg shadow-amber-400/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Feature Films ({ALL_MOVIE_GENRES.length})</span>
          </button>
          <button
            onClick={() => {
              cinemaAudio.playClick();
              setFilterType('tv');
              setSelectedWheelIndex(0);
            }}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-mono-code transition-all flex items-center justify-center gap-1.5 ${
              filterType === 'tv'
                ? 'bg-amber-400 text-black font-bold shadow-lg shadow-amber-400/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Series ({ALL_TV_GENRES.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedWheelIndex(0);
            }}
            placeholder="Search genre directory..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/60 font-sans transition-colors"
          />
        </div>
      </div>

      {/* 3. Main Split Stage: Left <OptionWheel /> + Right <FlexCarousel /> */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: 3D OptionWheel */}
        <div className="lg:col-span-4 rounded-3xl glass-card border border-white/15 p-5 flex flex-col justify-between overflow-hidden relative shadow-2xl min-h-[460px] lg:min-h-[600px] bg-gradient-to-b from-[#0e0e14] via-[#08080c] to-[#050508]">
          <div className="space-y-1 mb-2 z-10">
            <div className="flex items-center gap-2 text-amber-400 text-[10px] font-mono-code uppercase tracking-widest">
              <Disc3 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>3D Genre Dial</span>
            </div>
            <h3 className="font-cinzel text-xl font-bold text-white tracking-wide">
              Select Category
            </h3>
            <p className="text-white/40 text-[11px] font-sans">
              Drag or wheel to rotate the curved genre selector.
            </p>
          </div>

          {/* Interactive OptionWheel */}
          <div className="flex-1 w-full relative min-h-[340px] overflow-hidden my-2">
            {wheelLabels.length > 0 ? (
              <OptionWheel
                items={wheelLabels}
                defaultSelected={selectedWheelIndex}
                onChange={handleWheelChange}
                textColor="#71717a"
                activeColor="#f59e0b"
                side="left"
                fontSize={1.45}
                spacing={1.35}
                curve={0.9}
                tilt={8}
                blur={1.8}
                fade={0.3}
                smoothing={180}
                inset={32}
                loop={true}
                draggable={true}
                className="w-full h-full font-cinzel uppercase tracking-wider"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-xs font-mono-code">
                No matching genres
              </div>
            )}
          </div>

          {/* Active Genre Footer Card */}
          {currentGenre && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 z-10 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono-code text-amber-400">
                <span className="uppercase font-bold tracking-wider">{currentGenre.badge}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  {currentGenre.mediaType === 'movie' ? 'Film' : currentGenre.mediaType === 'tv' ? 'Series' : 'All'}
                </span>
              </div>
              <p className="text-xs text-white/60 font-sans line-clamp-2">
                {currentGenre.description}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: WebGL <FlexCarousel /> Component */}
        <div className="lg:col-span-8 rounded-3xl glass-card border border-white/15 p-5 flex flex-col justify-between overflow-hidden relative shadow-2xl min-h-[460px] lg:min-h-[600px] bg-gradient-to-b from-[#09090f] via-[#07070b] to-[#040407]">
          {/* Top Bar inside Right Stage */}
          <div className="flex items-center justify-between z-10 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide">
                  {currentGenre?.name || 'Curated'} Showcase
                </h3>
                <span className="text-[10px] font-mono-code text-white/40 uppercase tracking-widest">
                  WebGL Liquid Flex Lens · {genreTitles.length} Loaded Titles
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono-code text-white/40">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Click a poster to focus & inspect</span>
            </div>
          </div>

          {/* WebGL FlexCarousel Container */}
          <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[440px] my-2 overflow-hidden rounded-2xl bg-black/30 border border-white/5">
            {loadingCarousel ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50 font-mono-code text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <span>Loading {currentGenre?.name} reels...</span>
              </div>
            ) : flexItems.length > 0 ? (
              <FlexCarousel
                items={flexItems}
                preset="liquid"
                intro="rise"
                cardHeight={0.65}
                gap={16}
                squeeze={0.2}
                focusOnClick={true}
                captions={true}
                radius={18}
                lensWidth={0.7}
                roundness={0.85}
                bend={0.28}
                autoplay={false}
                onChange={handleCarouselChange}
                onSelect={handleCarouselSelect}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-xs font-mono-code">
                No titles available for this category
              </div>
            )}
          </div>

          {/* Active Centered Movie Quick-Action HUD */}
          {activeCenterMovie && (
            <div className="z-10 mt-2 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-display font-medium text-sm sm:text-base text-white">
                    {activeCenterMovie.title}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono-code text-amber-300">
                    <Star className="w-3 h-3 fill-amber-300" />
                    <span>{activeCenterMovie.vote_average.toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-[11px] font-mono-code text-white/40">
                  <span>{formatReleaseYear(activeCenterMovie)}</span>
                  <span className="mx-1.5">·</span>
                  <span className="uppercase">{activeCenterMovie.media_type}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    cinemaAudio.playClick();
                    onPlayTrailer(activeCenterMovie);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-mono-code font-bold flex items-center gap-1.5 transition-all shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Trailer</span>
                </button>

                <button
                  onClick={() => {
                    cinemaAudio.playClick();
                    onToggleWatched(activeCenterMovie);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono-code font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Mark Watched</span>
                </button>

                <button
                  onClick={() => {
                    cinemaAudio.playClick();
                    onSelectMovie(activeCenterMovie);
                  }}
                  className="p-2 rounded-full glass-card hover:border-white/30 text-white/70 hover:text-white transition-all"
                  title="Full Details"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
