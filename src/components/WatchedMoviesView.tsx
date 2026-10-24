import React, { useState, useMemo } from 'react';
import { TicketStub, MediaItem } from '../types/cinema';
import { Masonry, MasonryItem } from './reactbits/Masonry';
import { mapTicketsToMasonryItems } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
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
  Info
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
            lightbox={true}
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

      {/* 4. Active Title Quick Action Inspector Modal */}
      {activeItemDetails && (
        <div className="fixed bottom-6 right-6 z-40 max-w-md w-full p-4 rounded-3xl glass-card border border-white/20 bg-black/90 shadow-2xl backdrop-blur-2xl animate-fadeIn space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono-code text-amber-400 uppercase tracking-widest">
                Selected Watched Title
              </div>
              <h4 className="font-cinzel text-lg font-bold text-white">
                {activeItemDetails.title}
              </h4>
              <div className="flex items-center gap-2 text-xs font-mono-code text-white/50 mt-0.5">
                <span>{activeItemDetails.year}</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Star className="w-3 h-3 fill-amber-300" />
                  {activeItemDetails.rating?.toFixed(1) || '5.0'}
                </span>
                <span>·</span>
                <span>{activeItemDetails.watchDate}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveItemDetails(null)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          {activeItemDetails.review && (
            <p className="text-xs text-white/70 italic bg-white/5 p-2.5 rounded-xl border border-white/5">
              "{activeItemDetails.review}"
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            {onPlayTrailer && (
              <button
                onClick={() => {
                  cinemaAudio.playClick();
                  onPlayTrailer({
                    id: activeItemDetails.mediaId,
                    title: activeItemDetails.title,
                    overview: '',
                    poster_path: activeItemDetails.posterPath,
                    backdrop_path: activeItemDetails.backdropPath,
                    vote_average: 8.0,
                    vote_count: 100,
                    media_type: activeItemDetails.mediaType,
                    genre_ids: [],
                  });
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-white text-black text-xs font-mono-code font-bold flex items-center justify-center gap-1.5 hover:bg-white/90 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Trailer</span>
              </button>
            )}

            {onSelectMovie && (
              <button
                onClick={() => {
                  cinemaAudio.playClick();
                  onSelectMovie({
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
                  });
                  setActiveItemDetails(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-400 text-black text-xs font-mono-code font-bold flex items-center justify-center gap-1.5 hover:bg-amber-300 transition-all"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
            )}

            {onDeleteTicket && (
              <button
                onClick={() => {
                  cinemaAudio.playClick();
                  onDeleteTicket(activeItemDetails.id);
                  setActiveItemDetails(null);
                }}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                title="Remove from watched"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
