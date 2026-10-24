import React from 'react';
import { ViewMode } from '../types/cinema';
import { cinemaAudio } from '../services/audio';
import {
  Film,
  Compass,
  Sparkles,
  Ticket,
  Search,
  Bookmark,
  Volume2,
  VolumeX,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenSearch: () => void;
  watchlistCount: number;
  ticketCount: number;
  onOpenWatchlist: () => void;
  onOpenVault?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenSearch,
  watchlistCount,
  ticketCount,
  onOpenWatchlist,
  onOpenVault,
}) => {
  const [isMuted, setIsMuted] = React.useState(cinemaAudio.getMuted());
  const [projectorActive, setProjectorActive] = React.useState(false);

  const handleToggleMute = () => {
    const muted = cinemaAudio.toggleMute();
    setIsMuted(muted);
    if (!muted) cinemaAudio.playClick();
  };

  const handleToggleProjector = () => {
    const running = cinemaAudio.toggleProjector();
    setProjectorActive(running);
    cinemaAudio.playClick();
  };

  const setMode = (mode: ViewMode) => {
    cinemaAudio.playWhoosh();
    onViewModeChange(mode);
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-3 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setMode('landing')}>
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Film className="w-4 sm:w-5 h-4 sm:h-5 text-black" />
            </div>
            <div className="flex flex-col">
              <span className="font-cinzel font-bold text-base sm:text-xl tracking-[0.25em] text-white">
                OBSIDIAN
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono-code tracking-widest text-amber-400/80 uppercase -mt-1">
                Cinema Archive
              </span>
            </div>
          </div>

          {/* Right actions on mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => {
                cinemaAudio.playClick();
                onOpenSearch();
              }}
              aria-label="Search"
              className="p-2 rounded-full glass-card text-amber-400 hover:text-white"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
              className="p-2 rounded-full text-white/60 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Central Nav Tabs Managing All Pages: Landing (DriftWall), Moods, Genres, Ticket Vault */}
        <nav className="flex items-center p-1 bg-black/40 rounded-full border border-white/10 overflow-x-auto no-scrollbar justify-center sm:justify-start" aria-label="Main Navigation">
          <button
            onClick={() => setMode('landing')}
            aria-current={viewMode === 'landing' ? 'page' : undefined}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-display tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 ${
              viewMode === 'landing'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>DriftWall</span>
          </button>

          <button
            onClick={() => setMode('moods')}
            aria-current={viewMode === 'moods' ? 'page' : undefined}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-display tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 ${
              viewMode === 'moods'
                ? 'bg-purple-400 text-black font-semibold shadow-md shadow-purple-500/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Moods</span>
          </button>

          <button
            onClick={() => setMode('genres')}
            aria-current={viewMode === 'genres' ? 'page' : undefined}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-display tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 ${
              viewMode === 'genres'
                ? 'bg-cyan-400 text-black font-semibold shadow-md shadow-cyan-500/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Genres</span>
          </button>

          <button
            onClick={() => setMode('watched')}
            aria-current={viewMode === 'watched' ? 'page' : undefined}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-display tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 ${
              viewMode === 'watched'
                ? 'bg-amber-400 text-black font-bold shadow-lg shadow-amber-400/20'
                : 'text-amber-300/80 hover:text-amber-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Watched</span>
            {ticketCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${viewMode === 'watched' ? 'bg-black text-amber-300' : 'bg-amber-400/20 text-amber-300'}`}>
                {ticketCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right utility actions on desktop */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3">
          {/* Quick Search Button */}
          <button
            onClick={() => {
              cinemaAudio.playClick();
              onOpenSearch();
            }}
            aria-label="Search movies and shows"
            className="px-3 py-1.5 rounded-full glass-card hover:border-white/20 text-white/70 hover:text-white transition-all flex items-center gap-2 text-xs font-mono-code"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/50">⌘K</kbd>
          </button>

          {/* Watchlist Quick Filter */}
          <button
            onClick={() => {
              cinemaAudio.playClick();
              onOpenWatchlist();
            }}
            aria-label="View Watchlist"
            className="px-3 py-1.5 rounded-full glass-card hover:border-white/20 text-white/70 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono-code"
          >
            <Bookmark className="w-3.5 h-3.5 text-blue-400" />
            <span>Watchlist</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
              {watchlistCount}
            </span>
          </button>

          {/* Sound Controls */}
          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <button
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute mechanical sound effects' : 'Mute sound effects'}
              aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              onClick={handleToggleProjector}
              title={projectorActive ? 'Stop 35mm projector hum' : 'Start vintage 35mm projector hum'}
              aria-label="Toggle vintage 35mm projector motor hum"
              className={`p-2 rounded-full transition-all ${
                projectorActive ? 'text-amber-400 bg-amber-400/10' : 'text-white/40 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
