import React, { useState } from 'react';
import { MediaItem, TicketStub } from '../types/cinema';
import { formatReleaseYear, generateTicketBarcode } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { X, Star, CheckCircle2, Calendar } from 'lucide-react';

interface TicketStampModalProps {
  item: MediaItem;
  existingTicket?: TicketStub;
  onSaveTicket: (ticket: TicketStub) => void;
  onClose: () => void;
}

export const TicketStampModal: React.FC<TicketStampModalProps> = ({
  item,
  existingTicket,
  onSaveTicket,
  onClose,
}) => {
  const [rating, setRating] = useState<number>(existingTicket ? existingTicket.rating : 5);
  const [watchDate, setWatchDate] = useState<string>(
    existingTicket ? existingTicket.watchDate : new Date().toISOString().split('T')[0]
  );
  const [review, setReview] = useState<string>(
    existingTicket
      ? existingTicket.review
      : 'Masterful cinematic direction, commanding score, and indelible performances.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cinemaAudio.playStamp();

    const year = formatReleaseYear(item);
    const barcode = generateTicketBarcode(item.id, watchDate);

    const savedEntry: TicketStub = {
      id: existingTicket?.id || `watched-${item.id}-${Date.now()}`,
      mediaId: item.id,
      title: item.title,
      year,
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      watchDate,
      rating,
      review: review.trim(),
      theatre: 'Personal Screen',
      seat: 'WATCHED',
      finish: 'iridescent',
      barcode,
      mediaType: item.media_type,
      runtime: item.runtime,
      createdAt: existingTicket?.createdAt || Date.now(),
    };

    onSaveTicket(savedEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl glass-card overflow-hidden border border-white/15 shadow-2xl my-auto z-10 bg-[#0d0d12]">
        {/* Header */}
        <div className="p-5 sm:p-6 glass-panel border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white tracking-wide">
                Mark as Watched
              </h3>
              <p className="text-xs font-mono-code text-white/50">
                {item.title}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              cinemaAudio.playClick();
              onClose();
            }}
            className="p-2 rounded-full glass-card hover:border-white/30 text-white/60 hover:text-white transition-all"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body: Rating, Watch Date, and Review */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Rating Selector */}
            <div>
              <label className="block text-xs font-mono-code uppercase text-white/60 mb-2">
                Personal Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => {
                      cinemaAudio.playClick();
                      setRating(starVal);
                    }}
                    className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        starVal <= rating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-mono-code text-base font-bold text-amber-300 ml-2">
                  {rating.toFixed(1)} / 5.0
                </span>
              </div>
            </div>

            {/* 2. Watch Date */}
            <div>
              <label className="block text-xs font-mono-code uppercase text-white/60 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Watch Date</span>
              </label>
              <input
                type="date"
                value={watchDate}
                onChange={(e) => setWatchDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 font-mono-code"
              />
            </div>

            {/* 3. Review & Personal Notes */}
            <div>
              <label className="block text-xs font-mono-code uppercase text-white/60 mb-1.5">
                Review & Personal Notes
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                placeholder="Record your thoughts, impressions, key takeaways..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 font-sans resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black font-display font-bold text-sm tracking-wider uppercase transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Add to Watched</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
