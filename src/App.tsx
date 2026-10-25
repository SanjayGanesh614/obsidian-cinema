import React, { useState, useEffect, useMemo } from 'react';
import { MediaItem, ViewMode, WatchedEntry } from './types/cinema';
import { fetchTrending, CURATED_FALLBACK_FILMS } from './services/tmdb';
import { getStoredWatchlist, saveWatchlist, getStoredWatched, saveWatched, getStoredMedia, saveStoredMedia } from './services/storage';
import { 
  getCachedMediaItems, 
  getWatchedEntriesFromDb, 
  saveWatchedEntryToDb, 
  deleteWatchedEntryFromDb, 
  syncWatchedEntriesBatchToDb 
} from './services/neonDb';
import { extractCinemaColor } from './utils/pure';
import { cinemaAudio } from './services/audio';

// Components
import { Header } from './components/Header';
import { DriftWallHero } from './components/DriftWallHero';
import { MoodsSection } from './components/MoodsSection';
import { GenreReelSection } from './components/GenreReelSection';
import { WatchedMoviesView } from './components/WatchedMoviesView';
import { DetailModal } from './components/DetailModal';
import { TrailerModal } from './components/TrailerModal';
import { SearchBarModal } from './components/SearchBarModal';
import { WatchedRatingModal } from './components/WatchedRatingModal';

export default function App() {
  const [items, setItems] = useState<MediaItem[]>(() => getStoredMedia() || CURATED_FALLBACK_FILMS);
  const [activeItem, setActiveItem] = useState<MediaItem>(() => {
    const initial = getStoredMedia();
    return initial && initial.length > 0 ? initial[0] : CURATED_FALLBACK_FILMS[0];
  });
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [activeMoodColor, setActiveMoodColor] = useState<string | null>(null);

  // Library State
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(() => new Set(getStoredWatchlist()));
  const [watchedEntries, setWatchedEntries] = useState<WatchedEntry[]>(() => getStoredWatched());

  // Modal State
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [ratingModalItem, setRatingModalItem] = useState<MediaItem | null>(null);
  const [trailerItem, setTrailerItem] = useState<MediaItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const watchedIds = useMemo(() => new Set(watchedEntries.map((e) => e.mediaId)), [watchedEntries]);

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
          saveStoredMedia(dbItems);
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

  // Synchronize and hydrate watched movies from Neon DB so they persist permanently
  useEffect(() => {
    getWatchedEntriesFromDb()
      .then(({ entries: dbEntries, mediaItems: dbMediaItems }) => {
        if (dbEntries && dbEntries.length > 0) {
          // Merge database records with current local state
          setWatchedEntries((current) => {
            const map = new Map<number, WatchedEntry>();
            for (const dbe of dbEntries) {
              map.set(dbe.mediaId, dbe);
            }
            // Retain any newly added entries that haven't hit DB yet and push them
            for (const ce of current) {
              if (!map.has(ce.mediaId)) {
                map.set(ce.mediaId, ce);
                const media = items.find((m) => m.id === ce.mediaId) || 
                              CURATED_FALLBACK_FILMS.find((m) => m.id === ce.mediaId);
                saveWatchedEntryToDb(ce, media).catch(() => {});
              }
            }
            const merged = Array.from(map.values());
            saveWatched(merged);
            return merged;
          });

          // Ingest loaded MediaItems into global media library
          if (dbMediaItems && dbMediaItems.length > 0) {
            appendNewMedia(dbMediaItems);
          }
        } else {
          // If Neon DB has no watched movies yet, seed the current initial/local entries to Neon DB
          const currentWatched = getStoredWatched();
          if (currentWatched && currentWatched.length > 0) {
            const mediaMap = new Map<number, MediaItem>();
            items.forEach((m) => mediaMap.set(m.id, m));
            CURATED_FALLBACK_FILMS.forEach((m) => {
              if (!mediaMap.has(m.id)) mediaMap.set(m.id, m);
            });
            syncWatchedEntriesBatchToDb(currentWatched, mediaMap).catch(() => {});
          }
        }
      })
      .catch((err) => {
        console.warn('[Neon DB] Watched sync fallback:', err);
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

  // Save or update watched entry with rating & review
  const handleSaveWatchedEntry = (entry: WatchedEntry) => {
    const mediaItem = ratingModalItem?.id === entry.mediaId 
      ? ratingModalItem 
      : items.find((m) => m.id === entry.mediaId) || 
        CURATED_FALLBACK_FILMS.find((m) => m.id === entry.mediaId);

    // 1. Optimistic UI update
    setWatchedEntries((prev) => {
      const filtered = prev.filter((e) => e.mediaId !== entry.mediaId);
      const next = [entry, ...filtered];
      saveWatched(next);
      return next;
    });

    // 2. Ensure item is immediately present in global catalog so Watched view renders it
    if (mediaItem) {
      appendNewMedia([mediaItem]);
    }

    // 3. Persist permanently to Neon PostgreSQL
    saveWatchedEntryToDb(entry, mediaItem).catch((err) => {
      console.warn('[Neon DB] Failed to save watched entry to database:', err);
    });
  };

  // Remove watched entry
  const handleRemoveWatched = (mediaId: number) => {
    setWatchedEntries((prev) => {
      const next = prev.filter((e) => e.mediaId !== mediaId);
      saveWatched(next);
      return next;
    });

    // Remove from Neon PostgreSQL
    deleteWatchedEntryFromDb(mediaId).catch((err) => {
      console.warn('[Neon DB] Failed to remove watched entry from database:', err);
    });
  };

  // When marking as watched, open rating & review card
  const handlePromptWatched = (item: MediaItem) => {
    setRatingModalItem(item);
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
        watchedCount={watchedIds.size}
        onOpenWatchlist={() => setIsSearchOpen(true)}
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
              onToggleWatched={handlePromptWatched}
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
              onToggleWatched={handlePromptWatched}
            />
          </div>
        )}

        {viewMode === 'watched' && (
          <div className="animate-fadeIn pt-4">
            <WatchedMoviesView
              watchedEntries={watchedEntries}
              allMedia={items}
              onToggleWatched={(item) => {
                if (watchedIds.has(item.id)) {
                  handleRemoveWatched(item.id);
                } else {
                  handlePromptWatched(item);
                }
              }}
              onEditWatched={(item) => setRatingModalItem(item)}
              onSelectMovie={(item) => setDetailItem(item)}
              onPlayTrailer={(item) => setTrailerItem(item)}
              onClose={() => changeViewMode('landing')}
              onAppendMedia={appendNewMedia}
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
          onToggleWatched={(item) => handlePromptWatched(item)}
          onPlayTrailer={(item) => {
            setDetailItem(null);
            setTrailerItem(item);
          }}
        />
      )}

      {ratingModalItem && (
        <WatchedRatingModal
          item={ratingModalItem}
          existingEntry={watchedEntries.find((e) => e.mediaId === ratingModalItem.id)}
          onSave={handleSaveWatchedEntry}
          onRemove={handleRemoveWatched}
          onClose={() => setRatingModalItem(null)}
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
          onToggleWatched={(item) => handlePromptWatched(item)}
          watchlistIds={watchlistIds}
          watchedIds={watchedIds}
        />
      )}
    </div>
  );
}
