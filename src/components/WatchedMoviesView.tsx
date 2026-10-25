import React, { useState, useMemo, useEffect } from 'react';
import { TicketStub, MediaItem } from '../types/cinema';
import { Masonry, MasonryItem } from './reactbits/Masonry';
import { mapTicketsToMasonryItems, formatRuntime } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { fetchMediaDetails, getBackdropUrl, getPosterUrl } from '../services/tmdb';
import { 
  CheckCircle2, 
  Film, 
  Tv, 
  Star, 
  Clock, 
  Layers, 
  Trash2, 
  Play, 
  Sparkles,
  Move,
  Info,
  X,
  Calendar,
  MapPin,
  Quote,
  User
} from 'lucide-react';

interface WatchedMoviesViewProps {
  tickets: TicketStub[];
  onDeleteTicket?: (ticketId: string) => void;
  onSelectMovie?: (item: MediaItem) => void;
  onPlayTrailer?: (item: MediaItem) => void;
  onClose?: () => void;
}

export const WatchedMoviesView: React.FC<WatchedMoviesViewProps> = ({
  tickets,
  onDeleteTicket,
  onSelectMovie,
  onPlayTrailer,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv' | 'top'>('all');
  const [activeItemDetails, setActiveItemDetails] = useState<TicketStub | null>(null);
  const [enrichedMedia, setEnrichedMedia] = useState<MediaItem | null>(null);

  // Fetch full details for selected watched title
  useEffect(() => {
    if (!activeItemDetails) {
      setEnrichedMedia(null);
      return;
    }

    let isMounted = true;
    const baseMedia: MediaItem = {
      id: activeItemDetails.mediaId,
      title: activeItemDetails.title,
      overview: activeItemDetails.review || '',
      poster_path: activeItemDetails.posterPath,
      backdrop_path: activeItemDetails.backdropPath,
      vote_average: activeItemDetails.rating || 8.0,
      vote_count: 100,
      media_type: activeItemDetails.mediaType,
      genre_ids: [],
      release_date: activeItemDetails.watchDate,
    };

    fetchMediaDetails(activeItemDetails.mediaId, activeItemDetails.mediaType)
      .then((details) => {
        if (isMounted) {
          setEnrichedMedia({
            ...baseMedia,
            ...details,
          });
        }
      })
      .catch(() => {
        if (isMounted) setEnrichedMedia(baseMedia);
      });

    return () => {
      isMounted = false;
    };
  }, [activeItemDetails]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    let list = [...tickets];
    if (filterType === 'movie') {
      list = list.filter((t) => t.mediaType === 'movie');
    } else if (filterType === 'tv') {
      list = list.filter((t) => t.mediaType === 'tv');
    } else if (filterType === 'top') {
      list = list.filter((t) => (t.rating || 0) >= 4.8);
    }
    return list;
  }, [tickets, filterType]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = tickets.length;
    const avgRating = total > 0 ? (tickets.reduce((acc, t) => acc + (t.rating || 0), 0) / total).toFixed(1) : '0.0';
    const totalHours = total > 0 ? (tickets.reduce((acc, t) => acc + (t.runtime || 120), 0) / 60).toFixed(1) : '0';
    const movieCount = tickets.filter((t) => t.mediaType === 'movie').length;
    const tvCount = tickets.filter((t) => t.mediaType === 'tv').length;
    return { total, avgRating, totalHours, movieCount, tvCount };
  }, [tickets]);

  // Map tickets to React Bits Masonry items with organic variable dimensions
  const masonryItems: MasonryItem[] = useMemo(() => {
    return mapTicketsToMasonryItems(filteredTickets);
  }, [filteredTickets]);

  const handleTileClick = (item: MasonryItem) => {
    cinemaAudio.playClick();
    if (item.rawTicket) {
      setActiveItemDetails(item.rawTicket);
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
            A fluid, interactive masonry gallery of every film and series you've experienced. Reorder titles by dragging tiles, hover for details, or click any card for full-screen lightbox inspection.
          </p>
        </div>

        {/* Telemetry Stats Strip */}
        <div className="flex items-center gap-3 sm:gap-6 p-4 rounded-2xl glass-card border border-white/15 bg-black/40 shadow-2xl shrink-0">
          <div>
            <div className="text-[10px] font-mono-code text-white/40 uppercase">Watched</div>
            <div className="text-xl sm:text-2xl font-bold font-cinzel text-amber-300">
              {stats.total}
            </div>
            <div className="text-[10px] font-mono-code text-white/40">
              {stats.movieCount} Films · {stats.tvCount} TV
            </div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div>
            <div className="text-[10px] font-mono-code text-white/40 uppercase">Avg Rating</div>
            <div className="text-xl sm:text-2xl font-bold font-cinzel text-emerald-400 flex items-center gap-1">
              <Star className="w-4 h-4 fill-emerald-400" />
              <span>{stats.avgRating}</span>
            </div>
            <div className="text-[10px] font-mono-code text-white/40">Out of 5.0</div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div>
            <div className="text-[10px] font-mono-code text-white/40 uppercase">Screen Time</div>
            <div className="text-xl sm:text-2xl font-bold font-cinzel text-cyan-300">
              {stats.totalHours}h
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
            All Watched ({tickets.length})
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
            <span>Top Rated (≥4.8★)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-code text-white/40 self-end sm:self-auto">
          <Move className="w-3.5 h-3.5 text-amber-400" />
          <span>Drag tiles to reorder · Click for Lightbox</span>
        </div>
      </div>

      {/* 3. React Bits <Masonry /> Component Grid (lightbox=false to trigger Split Inspection) */}
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
              Mark titles as watched across the catalog to build your custom fluid masonry viewing wall.
            </p>
          </div>
        )}
      </div>

      {/* 4. Split Dual Inspection View: Left = Movie Details + Trailer; Right = Review & Notes Box */}
      {activeItemDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-5xl rounded-3xl glass-card overflow-hidden border border-white/20 shadow-2xl bg-[#0a0a0f] max-h-[90vh] flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => {
                cinemaAudio.playClick();
                setActiveItemDetails(null);
              }}
              className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white border border-white/15 transition-all shadow-lg"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Split Dual-Panel Body */}
            <div className="overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
              
              {/* LEFT SIDE (7-8 cols): Complete Movie Information Card & Trailer */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                {/* Backdrop with Trailer Play Overlay */}
                <div className="relative w-full h-56 sm:h-72 bg-black overflow-hidden shrink-0">
                  <img
                    src={getBackdropUrl(activeItemDetails.backdropPath, 'original')}
                    alt={activeItemDetails.title}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />

                  {/* Trailer Button Overlay */}
                  {onPlayTrailer && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={() => {
                          cinemaAudio.playClick();
                          onPlayTrailer(
                            enrichedMedia || {
                              id: activeItemDetails.mediaId,
                              title: activeItemDetails.title,
                              overview: '',
                              poster_path: activeItemDetails.posterPath,
                              backdrop_path: activeItemDetails.backdropPath,
                              vote_average: 8.0,
                              vote_count: 100,
                              media_type: activeItemDetails.mediaType,
                              genre_ids: [],
                            }
                          );
                        }}
                        className="group flex items-center gap-3 px-6 py-3 rounded-full glass-panel border border-white/30 text-white font-display font-semibold text-sm hover:scale-105 transition-all shadow-2xl"
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-black translate-x-0.5" />
                        </div>
                        <span>Watch Official Trailer</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Details Content */}
                <div className="p-6 sm:p-8 space-y-6 flex-1">
                  <div className="flex gap-5 items-start">
                    {/* Poster thumbnail */}
                    <img
                      src={getPosterUrl(activeItemDetails.posterPath, 'w342')}
                      alt={activeItemDetails.title}
                      className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-xl border border-white/15 shadow-2xl shrink-0"
                    />

                    {/* Metadata & Title */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15">
                          {activeItemDetails.mediaType === 'movie' ? 'Feature Film' : 'TV Series'}
                        </span>
                        <span className="text-xs font-mono-code text-white/50">{activeItemDetails.year}</span>
                        {enrichedMedia?.runtime && (
                          <span className="text-xs font-mono-code text-white/50">
                            · {formatRuntime(enrichedMedia.runtime)}
                          </span>
                        )}
                      </div>

                      <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white">
                        {activeItemDetails.title}
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
                      {enrichedMedia?.overview || 'No extended synopsis available.'}
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

              {/* RIGHT SIDE (4-5 cols): User Review & Personal Notes Box */}
              <div className="lg:col-span-5 xl:col-span-4 p-6 sm:p-7 flex flex-col justify-between bg-black/40 space-y-6">
                <div className="space-y-6">
                  {/* Watched Badge Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono-code font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Watched & Archived</span>
                    </div>
                    {activeItemDetails.finish && (
                      <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-300 bg-amber-400/10">
                        {activeItemDetails.finish.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Rating display */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono-code uppercase text-white/40 tracking-wider">
                      Your Score
                    </span>
                    <div className="flex items-center gap-1.5 text-amber-400">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(activeItemDetails.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-white/20'
                          }`}
                        />
                      ))}
                      <span className="font-cinzel font-bold text-lg text-white ml-2">
                        {activeItemDetails.rating?.toFixed(1) || '5.0'}
                      </span>
                    </div>
                  </div>

                  {/* Viewing Telemetry: Date, Location, Seat */}
                  <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-2.5 text-xs font-mono-code">
                    <div className="flex items-center gap-2 text-white/70">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Watched on: <strong className="text-white">{activeItemDetails.watchDate}</strong></span>
                    </div>
                    {activeItemDetails.theatre && (
                      <div className="flex items-center gap-2 text-white/70">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{activeItemDetails.theatre}</span>
                      </div>
                    )}
                    {activeItemDetails.seat && (
                      <div className="text-[11px] text-white/40 pl-5.5">
                        {activeItemDetails.seat}
                      </div>
                    )}
                  </div>

                  {/* Review & Personal Notes Box */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono-code uppercase text-white/40 tracking-wider">
                      <Quote className="w-3 h-3 text-amber-400" />
                      <span>Personal Notes & Review</span>
                    </div>
                    <div className="p-4 rounded-2xl glass-card border border-white/15 bg-white/[0.03] text-sm text-white/90 leading-relaxed italic font-serif">
                      "{activeItemDetails.review || 'No written thoughts recorded for this title.'}"
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Delete / Remove */}
                {onDeleteTicket && (
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => {
                        cinemaAudio.playClick();
                        onDeleteTicket(activeItemDetails.id);
                        setActiveItemDetails(null);
                      }}
                      className="text-xs font-mono-code text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-lg hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove from Watched</span>
                    </button>
                    <span className="text-[10px] font-mono-code text-white/30">
                      ID: {activeItemDetails.id.slice(0, 8)}
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
