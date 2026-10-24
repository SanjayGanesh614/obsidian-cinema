import React, { useEffect, useState } from 'react';
import { MediaItem } from '../types/cinema';
import { fetchMediaDetails } from '../services/tmdb';
import { cinemaAudio } from '../services/audio';
import { X, Film, AlertCircle } from 'lucide-react';

interface TrailerModalProps {
  item: MediaItem;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ item, onClose }) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(item.trailerKey || null);
  const [loading, setLoading] = useState<boolean>(!item.trailerKey);

  useEffect(() => {
    let isMounted = true;
    if (!item.trailerKey) {
      setLoading(true);
      fetchMediaDetails(item.id, item.media_type)
        .then((details) => {
          if (isMounted) {
            setTrailerKey(details.trailerKey || null);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [item]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg">
      <div className="relative w-full max-w-4xl rounded-3xl glass-card overflow-hidden border border-white/20 shadow-2xl flex flex-col">
        {/* Header bar */}
        <div className="p-4 sm:p-5 glass-panel border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white truncate max-w-md">
                {item.title} — Official Trailer
              </h3>
              <p className="text-xs font-mono-code text-white/50">
                Direct Cinema Projection
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              cinemaAudio.playClick();
              onClose();
            }}
            className="p-2 rounded-full glass-card hover:border-white/30 text-white/70 hover:text-white transition-all"
            aria-label="Close trailer player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-white/60">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono-code tracking-wider uppercase">
                Loading Cinema Projection Stream...
              </span>
            </div>
          ) : trailerKey ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&modestbranding=1&rel=0`}
              title={`${item.title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="text-center p-8 max-w-md">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h4 className="font-display text-lg text-white font-medium mb-1">
                Trailer Projection Stream Offline
              </h4>
              <p className="text-xs font-sans text-white/50 mb-4">
                The studio has restricted embedded streaming for this title or no public trailer key is currently registered in TMDB.
              </p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  item.title + ' official trailer'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black font-display font-semibold text-xs tracking-wider uppercase hover:bg-white/90 transition-all"
              >
                Search on YouTube
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
