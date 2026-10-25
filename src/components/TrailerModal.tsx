import React, { useEffect, useState, useRef } from 'react';
import { MediaItem } from '../types/cinema';
import { fetchMediaDetails, getBackdropUrl, getPosterUrl } from '../services/tmdb';
import { formatReleaseYear } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { X, Film, AlertCircle, Play, Sparkles, Volume2 } from 'lucide-react';

interface TrailerModalProps {
  item: MediaItem;
  onClose: () => void;
  directVideoUrl?: string;
  autoPlay?: boolean;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({
  item,
  onClose,
  directVideoUrl,
  autoPlay = false,
}) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(item.trailerKey || null);
  const [loading, setLoading] = useState<boolean>(!item.trailerKey);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Clean teardown helper: detaches decoder, removes media stream and cancels loading
  const teardownPlayer = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
      videoRef.current = null;
    }
  };

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
      if (e.key === 'Escape') {
        teardownPlayer();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', onKeyDown);
      teardownPlayer();
    };
  }, [item, onClose]);

  const handleClose = () => {
    cinemaAudio.playClick();
    teardownPlayer();
    onClose();
  };

  const handleStartPlay = () => {
    cinemaAudio.playClick();
    setIsPlaying(true);
  };

  const backdropSrc = item.backdrop_path
    ? getBackdropUrl(item.backdrop_path, 'w1280')
    : item.poster_path
    ? getPosterUrl(item.poster_path, 'w500')
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} Trailer Projection`}
    >
      <div className="relative w-full max-w-4xl rounded-3xl glass-card overflow-hidden border border-white/20 shadow-2xl flex flex-col bg-[#070707]">
        {/* Header bar */}
        <div className="p-4 sm:p-5 glass-panel border-b border-white/10 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/20">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white truncate max-w-md">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono-code text-white/50">
                <span>{formatReleaseYear(item)}</span>
                <span>·</span>
                <span className="text-amber-400">★ {item.vote_average.toFixed(1)}</span>
                <span>·</span>
                <span className="text-white/40 uppercase tracking-wider text-[10px]">
                  {isPlaying ? 'Live Projection Stream' : 'Instant Cinema Facade'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPlaying && (
              <button
                onClick={() => {
                  teardownPlayer();
                  setIsPlaying(false);
                }}
                className="px-3 py-1 rounded-full glass-card hover:border-white/30 text-xs font-mono-code text-white/70 hover:text-white transition-all hidden sm:inline-flex items-center gap-1.5"
              >
                <span>Facade View</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-full glass-card hover:border-white/30 text-white/70 hover:text-white transition-all"
              aria-label="Close trailer player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player / Facade Viewport */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {/* FACADE VIEW: Zero background decoders, zero iframe overhead */}
          {!isPlaying ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center group cursor-pointer" onClick={handleStartPlay}>
              {/* High-res cinematic backdrop */}
              {backdropSrc ? (
                <img
                  src={backdropSrc}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
              )}

              {/* Obsidian cinema vignettes */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/80" />

              {/* Centered Glowing Play Trigger */}
              <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
                <button
                  type="button"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-2xl shadow-amber-400/40 group-hover:scale-110 group-hover:bg-amber-300 transition-all duration-300"
                  aria-label="Play trailer stream"
                >
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
                </button>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-xs font-mono-code uppercase tracking-widest text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Instant Cinema Projection</span>
                  </div>
                  <p className="text-xs font-mono-code text-white/60">
                    Click to initialize stream · Zero background decoder idle
                  </p>
                </div>
              </div>

              {/* Bottom Info Bar Overlay */}
              <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[11px] font-mono-code text-white/50 z-10 pointer-events-none">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Stereo Master Audio</span>
                </div>
                <span>Fast-Start Decoder Facade</span>
              </div>
            </div>
          ) : /* ACTIVE PLAYER VIEW: Dynamically mounted stream */
          directVideoUrl ? (
            <video
              ref={videoRef}
              src={directVideoUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          ) : loading ? (
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

