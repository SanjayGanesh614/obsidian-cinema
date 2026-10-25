import React, { useState } from 'react';
import { MediaItem, WatchedEntry } from '../types/cinema';
import { getPosterUrl } from '../services/tmdb';
import { formatReleaseYear } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { Star, X, Check, Calendar, Trash2, MessageSquare } from 'lucide-react';

interface WatchedRatingModalProps {
  item: MediaItem;
  existingEntry?: WatchedEntry;
  onSave: (entry: WatchedEntry) => void;
  onRemove?: (mediaId: number) => void;
  onClose: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: '1.0 · Disappointing',
  2: '2.0 · Fair',
  3: '3.0 · Good',
  4: '4.0 · Great',
  5: '5.0 · Masterpiece',
};

export const WatchedRatingModal: React.FC<WatchedRatingModalProps> = ({
  item,
  existingEntry,
  onSave,
  onRemove,
  onClose,
}) => {
  const [rating, setRating] = useState<number>(existingEntry?.rating ?? 5.0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [review, setReview] = useState<string>(existingEntry?.review ?? '');
  const [watchDate, setWatchDate] = useState<string>(
    existingEntry?.watchDate ?? new Date().toISOString().slice(0, 10)
  );

  const displayRating = hoveredRating !== null ? hoveredRating : rating;
  const year = formatReleaseYear(item);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cinemaAudio.playClick();
    onSave({
      mediaId: item.id,
      rating: Math.max(1, Math.min(5, Number(rating))),
      review: review.trim(),
      watchDate: watchDate || new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg rounded-3xl glass-card overflow-hidden border border-white/20 shadow-2xl bg-[#0c0c12] flex flex-col p-6 sm:p-7 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            cinemaAudio.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. Film Header Info */}
        <div className="flex items-center gap-4 pr-6">
          <img
            src={getPosterUrl(item.poster_path, 'w342')}
            alt={item.title}
            className="w-14 sm:w-16 aspect-[2/3] object-cover rounded-xl border border-white/15 shadow-xl shrink-0"
          />
          <div className="space-y-1 overflow-hidden">
            <span className="text-[10px] font-mono-code uppercase tracking-wider text-amber-400">
              Mark as Watched
            </span>
            <h3 id="rating-modal-title" className="font-cinzel text-lg sm:text-xl font-bold text-white truncate">
              {item.title}
            </h3>
            <p className="text-xs font-mono-code text-white/50">
              {year} · {item.media_type === 'movie' ? 'Feature Film' : 'TV Series'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 2. Star Rating (1 to 5) */}
          <div className="space-y-2 p-4 rounded-2xl glass-card border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono-code uppercase text-white/60 tracking-wider">
                Your Rating (Out of 5)
              </label>
              <span className="text-xs font-mono-code font-bold text-amber-300">
                {RATING_LABELS[Math.round(displayRating)] || `${displayRating.toFixed(1)} / 5.0`}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled = starVal <= displayRating;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onMouseEnter={() => setHoveredRating(starVal)}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={() => {
                      cinemaAudio.playClick();
                      setRating(starVal);
                    }}
                    className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    aria-label={`Rate ${starVal} out of 5 stars`}
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                          : 'text-white/20 hover:text-white/40'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Personal Review / Thoughts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono-code uppercase text-white/60 tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Review & Thoughts</span>
              </label>
              <span className="text-[10px] font-mono-code text-white/40">Optional</span>
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What stood out? Favorite moments, cinematography, themes, or overall impressions..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/50 transition-all font-sans resize-none"
            />
          </div>

          {/* 4. Watch Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono-code uppercase text-white/60 tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Watched Date</span>
            </label>
            <input
              type="date"
              value={watchDate}
              onChange={(e) => setWatchDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono-code focus:outline-none focus:border-amber-400/60 transition-all cursor-pointer"
            />
          </div>

          {/* 5. Submit & Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {existingEntry && onRemove ? (
              <button
                type="button"
                onClick={() => {
                  cinemaAudio.playClick();
                  onRemove(item.id);
                  onClose();
                }}
                className="text-xs font-mono-code text-rose-400 hover:text-rose-300 py-2.5 px-3 rounded-xl hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Unmark Watched</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-mono-code text-white/50 hover:text-white py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black font-display font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer ml-auto"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{existingEntry ? 'Update Review' : 'Save Watched'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
