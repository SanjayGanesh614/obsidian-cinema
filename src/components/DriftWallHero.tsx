import React, { useState, useMemo } from 'react';
import { MediaItem } from '../types/cinema';
import { getPosterUrl } from '../services/tmdb';
import { formatReleaseYear } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { DriftWall, DriftItem } from './reactbits/DriftWall';
import { Gauge, Compass } from 'lucide-react';

interface DriftWallHeroProps {
  items: MediaItem[];
  onSelectMovie: (item: MediaItem) => void;
}

export const DriftWallHero: React.FC<DriftWallHeroProps> = ({
  items,
  onSelectMovie,
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
      image: getPosterUrl(m.poster_path, 'w342'),
      title: m.title,
      year: formatReleaseYear(m),
      rating: m.vote_average,
      mediaItem: m,
    }));
  }, [filteredMovies]);

  const handleTileClick = (tile: DriftItem) => {
    cinemaAudio.playClick();
  };

  const handleTileDoubleClick = (tile: DriftItem) => {
    cinemaAudio.playClick();
    if (tile.mediaItem) {
      onSelectMovie(tile.mediaItem);
    }
  };

  return (
    <section className="relative w-full h-full overflow-hidden bg-[#070707]">
      {/* Sleek Floating Glass HUD: Title, Mood Filters, and Speed */}
      <div className="absolute top-4 inset-x-0 z-20 pointer-events-none px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 bg-[#070707]/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
          {/* Title & Stream Count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono-code font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 animate-spin-slow" />
              <span>DriftWall</span>
            </div>
            <span className="hidden sm:inline text-xs font-mono-code text-white/40">·</span>
            <span className="text-xs font-mono-code text-white/50 hidden sm:inline">
              {driftItems.length} curated titles
            </span>
          </div>

          {/* Filter Mood Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  cinemaAudio.playClick();
                  setActiveMoodFilter(tab.id);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-mono-code uppercase whitespace-nowrap transition-all ${activeMoodFilter === tab.id
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-[11px] font-mono-code text-white/70">
            <Gauge className="w-3 h-3 text-amber-400" />
            {(['calm', 'drift', 'kinetic'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  cinemaAudio.playClick();
                  setSpeedLevel(s);
                }}
                className={`px-2 py-0.5 rounded-full capitalize transition-all ${speedLevel === s
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-white/50 hover:text-white'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen DriftWall Viewport Container */}
      <div className="w-full h-full">
        <DriftWall
          items={driftItems}
          speed={speedValues[speedLevel]}
          onItemClick={handleTileClick}
          onItemDoubleClick={handleTileDoubleClick}
          className="w-full h-full"
        />

        {/* Ambient Top & Bottom Vignettes */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#070707]/90 via-[#070707]/40 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#070707]/90 via-[#070707]/40 to-transparent pointer-events-none z-10" />

        {/* Floating guidance badge */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="glass-panel px-4 py-1.5 rounded-full border border-white/15 text-[11px] font-mono-code text-white/70 shadow-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Hover to Pop Up · Double-Click to View Details</span>
          </div>
        </div>
      </div>
    </section>
  );
};
