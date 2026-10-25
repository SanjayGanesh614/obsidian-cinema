import React, { useState, useEffect, useMemo } from 'react';
import { MediaItem, ViewMode, TicketStub } from './types/cinema';
import { fetchTrending, CURATED_FALLBACK_FILMS } from './services/tmdb';
import { getStoredWatchlist, saveWatchlist, getStoredTickets, saveTickets } from './services/storage';
import { getCachedMediaItems } from './services/neonDb';
import { extractCinemaColor } from './utils/pure';
import { cinemaAudio } from './services/audio';

// Components
import { Header } from './components/Header';
import { DriftWallHero } from './components/DriftWallHero';
import { MoodsSection } from './components/MoodsSection';
import { GenreReelSection } from './components/GenreReelSection';
import { WatchedMoviesView } from './components/WatchedMoviesView';
import { DetailModal } from './components/DetailModal';
import { TicketStampModal } from './components/TicketStampModal';
import { TrailerModal } from './components/TrailerModal';
import { SearchBarModal } from './components/SearchBarModal';

export default function App() {
  const [items, setItems] = useState<MediaItem[]>(CURATED_FALLBACK_FILMS);
  const [activeItem, setActiveItem] = useState<MediaItem>(CURATED_FALLBACK_FILMS[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [activeMoodColor, setActiveMoodColor] = useState<string | null>(null);

  // Library State
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(() => new Set(getStoredWatchlist()));
  const [tickets, setTickets] = useState<TicketStub[]>(() => getStoredTickets());

  // Modal State
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [stampItem, setStampItem] = useState<MediaItem | null>(null);
  const [trailerItem, setTrailerItem] = useState<MediaItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const watchedIds = useMemo(() => new Set(tickets.map((t) => t.mediaId)), [tickets]);

  // Ingest newly discovered items from search or browsing into global state
  const appendNewMedia = (newItems: MediaItem[]) => {
    if (!newItems || newItems.length === 0) return;
    setItems((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const additions = newItems.filter((m) => !existingIds.has(m.id));
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  };

  // Load all Neon DB cached movies on start (DB-first for instant DriftWall exhibition)
  useEffect(() => {
    getCachedMediaItems(150)
      .then((dbItems) => {
        if (dbItems && dbItems.length > 0) {
          setItems(dbItems);
          setActiveItem(dbItems[0]);
        } else {
          // If DB is empty, fetch from TMDB
          return fetchTrending('all', 'week').then((data) => {
            if (data && data.length > 0) {
              setItems(data);
              setActiveItem(data[0]);
            }
          });
        }
      })
      .catch((err) => {
        console.warn('Initial live DB/TMDB fetch fallback:', err);
      });
  }, []);

  // Global Keyboard shortcuts: Cmd+K / Slash for search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Watchlist Toggle
  const handleToggleWatchlist = (item: MediaItem) => {
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      saveWatchlist(Array.from(next));
      return next;
    });
  };

  // Ticket Stamping / Saving
  const handleSaveTicket = (ticket: TicketStub) => {
    setTickets((prev) => {
      const filtered = prev.filter((t) => t.id !== ticket.id);
      const next = [ticket, ...filtered];
      saveTickets(next);
      return next;
    });
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets((prev) => {
      const next = prev.filter((t) => t.id !== ticketId);
      saveTickets(next);
      return next;
    });
  };

  // Ambient lighting color
  const ambientColors = useMemo(() => {
    if (activeMoodColor && viewMode === 'moods') {
      return { primary: activeMoodColor, secondary: '#070707' };
    }
    return extractCinemaColor(activeItem);
  }, [activeItem, activeMoodColor, viewMode]);

  const changeViewMode = (mode: ViewMode) => {
    cinemaAudio.playWhoosh();
    setViewMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#070707] text-[#ededed] overflow-x-hidden selection:bg-amber-400/20 selection:text-amber-200">
      {/* 1. Film Grain Overlay */}
      <div className="film-grain" />

      {/* 2. Ambient Stars Backdrop */}
      <div className="ambient-stars" />

      {/* 3. Dynamic Ambient Background Glow Mesh */}
      <div
        className="ambient-lighting"
        style={{
          background: `radial-gradient(circle at 50% 15%, ${ambientColors.primary}35 0%, ${ambientColors.secondary}20 35%, transparent 70%)`,
        }}
      />

      {/* 4. Single Unified Header Navigation Bar */}
      <Header
        viewMode={viewMode}
        onViewModeChange={changeViewMode}
        onOpenSearch={() => setIsSearchOpen(true)}
        watchlistCount={watchlistIds.size}
        ticketCount={tickets.length}
        onOpenWatchlist={() => setIsSearchOpen(true)}
        onOpenVault={() => changeViewMode(viewMode === 'watched' ? 'landing' : 'watched')}
      />

      {/* 5. Main Experience Page Switching */}
      <main className={`relative z-10 ${viewMode === 'landing' ? 'overflow-hidden' : 'pb-16'}`}>
        {viewMode === 'landing' && (
          <div className="animate-fadeIn w-full h-[calc(100vh-65px)]">
            {/* Flagship Fullscreen DriftWall 3D Kinetic Exhibition */}
            <DriftWallHero
              items={items}
              onSelectMovie={(item) => {
                setActiveItem(item);
                setDetailItem(item);
              }}
            />
          </div>
        )}

        {viewMode === 'moods' && (
          <div className="animate-fadeIn pt-4">
            <MoodsSection
              items={items}
              onSelectMovie={(item) => {
                setActiveItem(item);
                setDetailItem(item);
              }}
              onPlayTrailer={(item) => setTrailerItem(item)}
              onStampTicket={(item) => setStampItem(item)}
              onMoodSelect={(mood) => setActiveMoodColor(mood.color)}
            />
          </div>
        )}

        {viewMode === 'genres' && (
          <div className="animate-fadeIn pt-4">
            <GenreReelSection
              items={items}
              onSelectMovie={(item) => {
                setActiveItem(item);
                setDetailItem(item);
              }}
              onPlayTrailer={(item) => setTrailerItem(item)}
              onStampTicket={(item) => setStampItem(item)}
            />
          </div>
        )}

        {(viewMode === 'watched' || viewMode === 'vault') && (
          <div className="animate-fadeIn pt-4">
            <WatchedMoviesView
              tickets={tickets}
              onDeleteTicket={handleDeleteTicket}
              onSelectMovie={(item) => setDetailItem(item)}
              onPlayTrailer={(item) => setTrailerItem(item)}
              onClose={() => changeViewMode('landing')}
            />
          </div>
        )}
      </main>

      {/* 6. Modals */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          isInWatchlist={watchlistIds.has(detailItem.id)}
          isWatched={watchedIds.has(detailItem.id)}
          onClose={() => setDetailItem(null)}
          onToggleWatchlist={handleToggleWatchlist}
          onStampTicket={(item) => {
            setDetailItem(null);
            setStampItem(item);
          }}
          onPlayTrailer={(item) => {
            setDetailItem(null);
            setTrailerItem(item);
          }}
        />
      )}

      {stampItem && (
        <TicketStampModal
          item={stampItem}
          existingTicket={tickets.find((t) => t.mediaId === stampItem.id)}
          onSaveTicket={handleSaveTicket}
          onClose={() => setStampItem(null)}
        />
      )}

      {trailerItem && (
        <TrailerModal
          item={trailerItem}
          onClose={() => setTrailerItem(null)}
        />
      )}

      {isSearchOpen && (
        <SearchBarModal
          onClose={() => setIsSearchOpen(false)}
          onSelect={(item) => {
            appendNewMedia([item]);
            setActiveItem(item);
            setDetailItem(item);
          }}
          onResultsFetched={(newResults) => appendNewMedia(newResults)}
          onToggleWatchlist={handleToggleWatchlist}
          onStampTicket={(item) => setStampItem(item)}
          watchlistIds={watchlistIds}
          watchedIds={watchedIds}
        />
      )}
    </div>
  );
}
