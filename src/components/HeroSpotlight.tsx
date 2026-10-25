import React from 'react';
import { MediaItem } from '../types/cinema';
import { getBackdropUrl, getPosterUrl } from '../services/tmdb';
import { formatReleaseYear, formatRuntime, extractCinemaColor } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { Play, Bookmark, Check, Info, Star } from 'lucide-react';

interface HeroSpotlightProps {
  item: MediaItem;
  isInWatchlist: boolean;
  isWatched: boolean;
  onToggleWatchlist: (item: MediaItem) => void;
  onToggleWatched: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
  onPlayTrailer: (item: MediaItem) => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  item,
  isInWatchlist,
  isWatched,
  onToggleWatchlist,
  onToggleWatched,
  onOpenDetails,
  onPlayTrailer,
}) => {
  const colors = extractCinemaColor(item);
  const year = formatReleaseYear(item);
  const backdropUrl = getBackdropUrl(item.backdrop_path, 'original');
  const posterUrl = getPosterUrl(item.poster_path, 'w500');

  return (
    <section className="relative w-full min-h-[460px] sm:min-h-[520px] flex items-end overflow-hidden pb-10 pt-16 px-4 sm:px-8 border-b border-white/5">
      {/* High-res backdrop with cinematic gradient vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={backdropUrl}
          alt={item.title}
          className="w-full h-full object-cover object-center opacity-30 scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/60 to-transparent" />
      </div>

      {/* Dynamic Ambient Background Cast Light */}
      <div
        className="ambient-lighting"
        style={{
          background: `radial-gradient(circle at 60% 30%, ${colors.primary} 0%, ${colors.secondary} 40%, transparent 75%)`,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        {/* Left Editorial Info */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Badge line */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono-code font-bold uppercase tracking-wider bg-white/10 text-white/90 border border-white/15">
              {item.media_type === 'movie' ? 'FEATURE FILM' : 'SERIES ARCHIVE'}
            </span>
            <span className="text-xs font-mono-code text-white/60">
              {year}
            </span>
            {item.runtime && (
              <span className="text-xs font-mono-code text-white/60">
                · {formatRuntime(item.runtime)}
              </span>
            )}
            <div className="flex items-center gap-1 text-amber-400 font-mono-code text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="font-bold">{item.vote_average.toFixed(1)}</span>
              <span className="text-white/40">({item.vote_count.toLocaleString()})</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08] drop-shadow-2xl">
            {item.title}
          </h1>

          {/* Tagline or director */}
          {item.tagline && (
            <p className="font-display italic text-base sm:text-lg text-amber-300/80 font-normal">
              "{item.tagline}"
            </p>
          )}

          {/* Synopsis */}
          <p className="text-white/70 text-sm sm:text-base max-w-2xl line-clamp-3 leading-relaxed font-sans">
            {item.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
            {/* Watch Trailer */}
            <button
              onClick={() => {
                cinemaAudio.playClick();
                onPlayTrailer(item);
              }}
              className="px-6 py-3 rounded-full bg-white hover:bg-white/90 text-black font-display font-bold text-sm tracking-wide uppercase transition-all shadow-xl hover:scale-105 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Watch Trailer</span>
            </button>

            {/* Mark Watched Toggle */}
            <button
              onClick={() => {
                cinemaAudio.playClick();
                onToggleWatched(item);
              }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black font-display font-bold text-sm tracking-wide uppercase transition-all shadow-lg shadow-amber-500/25 hover:scale-105 flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isWatched ? 'Watched ✓' : 'Mark Watched'}</span>
            </button>

            {/* Watchlist Toggle */}
            <button
              onClick={() => {
                cinemaAudio.playClick();
                onToggleWatchlist(item);
              }}
              className={`p-3 rounded-full glass-card border transition-all ${
                isInWatchlist
                  ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                  : 'border-white/15 text-white/80 hover:text-white hover:border-white/30'
              }`}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isInWatchlist ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>

            {/* Details Modal */}
            <button
              onClick={() => {
                cinemaAudio.playClick();
                onOpenDetails(item);
              }}
              className="p-3 rounded-full glass-card border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all"
              title="Full Credits & Details"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Floating Mini-Poster with 3D Tilt Glint */}
        <div className="hidden lg:flex lg:col-span-4 justify-end">
          <div
            onClick={() => onOpenDetails(item)}
            className="group relative w-56 aspect-[2/3] rounded-2xl overflow-hidden glass-card p-1.5 shadow-2xl cursor-pointer transition-transform duration-500 hover:scale-105 hover:-rotate-1"
          >
            <img
              src={posterUrl}
              alt={item.title}
              className="w-full h-full object-cover rounded-xl"
            />
            {/* Holographic foil overlay on card hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 holographic-foil pointer-events-none rounded-2xl transition-opacity duration-300" />
            <div className="absolute bottom-3 left-3 right-3 text-center">
              <span className="glass-panel text-[11px] font-mono-code px-3 py-1 rounded-full text-white/90 border border-white/20">
                Click to Inspect
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
