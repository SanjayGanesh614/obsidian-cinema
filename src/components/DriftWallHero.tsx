import React, { useState, useMemo } from 'react';
import { MediaItem } from '../types/cinema';
import { getPosterUrl } from '../services/tmdb';
import { formatReleaseYear } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { DriftWall, DriftItem } from './reactbits/DriftWall';
import { Sparkles, Gauge, Compass, Eye, Play, Ticket } from 'lucide-react';

interface DriftWallHeroProps {
  items: MediaItem[];
  onSelectMovie: (item: MediaItem) => void;
  onHoverMovie?: (item: MediaItem) => void;
  onPlayTrailer: (item: MediaItem) => void;
  onStampTicket: (item: MediaItem) => void;
}

export const DriftWallHero: React.FC<DriftWallHeroProps> = ({
  items,
  onSelectMovie,
  onHoverMovie,
  onPlayTrailer,
  onStampTicket,
}) => {
  const [speedLevel, setSpeedLevel] = useState<'calm' | 'drift' | 'kinetic'>('drift');
  const [activeMoodFilter, setActiveMoodFilter] = useState<string>('all');

  const filterTabs = [
    { id: 'all', label: 'All Curated Titles' },
    { id: 'scifi', label: 'Sci-Fi & Cosmic', genreId: 878 },
    { id: 'drama', label: 'Drama & A24', genreId: 18 },
    { id: 'thriller', label: 'Noir & Thrillers', genreId: 53 },
    { id: 'crime', label: 'Crime Sagas', genreId: 80 },
  ];

  const filteredMovies = useMemo(() => {
    if (activeMoodFilter === 'all') return items;
    const tab = filterTabs.find((t) => t.id === activeMoodFilter);
    if (!tab || !tab.genreId) return items;
    const matched = items.filter((m) => m.genre_ids.includes(tab.genreId!));
    return matched.length > 0 ? matched : items;
  }, [items, activeMoodFilter]);

  const speedValues = {
    calm: 22,
    drift: 42,
    kinetic: 72,
  };

  // Convert MediaItems to DriftItems
  const driftItems: DriftItem[] = useMemo(() => {
    return filteredMovies.map((m) => ({
      image: getPosterUrl(m.poster_path, 'w500'),
      title: m.title,
      year: formatReleaseYear(m),
      rating: m.vote_average,
      mediaItem: m,
    }));
  }, [filteredMovies]);

  const handleTileClick = (tile: DriftItem) => {
    cinemaAudio.playClick();
    if (tile.mediaItem) {
      onSelectMovie(tile.mediaItem);
    }
  };

  return (
    <section className="relative w-full overflow-hidden pt-8 pb-12 border-b border-white/5">
      {/* Editorial Title Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-widest mb-1.5">
            <Compass className="w-4 h-4 animate-spin-slow" />
            <span>Interactive 3D Kinetic Exhibition</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            The Cinema DriftWall
          </h2>
          <p className="text-white/60 text-sm max-w-xl font-sans mt-1">
            Immerse yourself in our continuous 3D perspective stream. Hover any title to elevate into the foreground, or click to inspect full archival details and mint a holographic ticket.
          </p>
        </div>

        {/* Speed & Direction Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="glass-panel px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 text-xs font-mono-code text-white/70">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white/40">Drift:</span>
            {(['calm', 'drift', 'kinetic'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  cinemaAudio.playClick();
                  setSpeedLevel(s);
                }}
                className={`px-2 py-0.5 rounded-full capitalize transition-all ${
                  speedLevel === s
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Mood Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-5 overflow-x-auto no-scrollbar flex items-center gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              cinemaAudio.playClick();
              setActiveMoodFilter(tab.id);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono-code uppercase whitespace-nowrap transition-all ${
              activeMoodFilter === tab.id
                ? 'bg-white text-black font-bold shadow-lg shadow-white/10'
                : 'glass-card text-white/60 hover:text-white hover:border-white/25'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="text-xs font-mono-code text-white/40 ml-auto shrink-0 hidden md:inline">
          {driftItems.length} titles streaming
        </span>
      </div>

      {/* DriftWall Viewport Container */}
      <div className="relative w-full h-[620px] sm:h-[680px] bg-[#070707]">
        {/* React Bits DriftWall Component */}
        <DriftWall
          items={driftItems}
          columns={5}
          tileWidth={210}
          tileHeight={315}
          gap={20}
          radius={16}
          tilt={15}
          turn={-13}
          roll={0}
          perspective={1150}
          depth={130}
          speed={speedValues[speedLevel]}
          direction="up"
          variance={0.42}
          parallax={0.65}
          lift={70}
          fade={0.55}
          dim={0.45}
          grayscale={false}
          overlayColor="#070707"
          onItemClick={handleTileClick}
          className="w-full h-full"
        />

        {/* Ambient Top & Bottom Vignettes */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#070707] to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#070707] to-transparent pointer-events-none z-10" />

        {/* Floating guidance badge */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="glass-panel px-4 py-1.5 rounded-full border border-white/15 text-[11px] font-mono-code text-white/70 shadow-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Pointer Parallax Active · Hover to Elevate · Click to Open Details</span>
          </div>
        </div>
      </div>
    </section>
  );
};
