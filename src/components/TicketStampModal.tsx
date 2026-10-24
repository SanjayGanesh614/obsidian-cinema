import React, { useState } from 'react';
import { MediaItem, TicketStub, HolographicFinish } from '../types/cinema';
import { formatReleaseYear, generateTicketBarcode } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { HolographicTicket3D } from './three/HolographicTicket3D';
import { X, Star, Check, Sparkles, Calendar, MapPin } from 'lucide-react';

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
  const [theatre, setTheatre] = useState<string>(
    existingTicket ? existingTicket.theatre : 'BFI IMAX London'
  );
  const [seat, setSeat] = useState<string>(
    existingTicket ? existingTicket.seat : 'ORCHESTRA ROW F · SEAT 14'
  );
  const [finish, setFinish] = useState<HolographicFinish>(
    existingTicket ? existingTicket.finish : 'iridescent'
  );
  const [review, setReview] = useState<string>(
    existingTicket
      ? existingTicket.review
      : 'Masterful cinematic direction, commanding score, and indelible performances.'
  );

  // If already stamped, show 3D preview mode with option to edit
  const [isEditing, setIsEditing] = useState<boolean>(!existingTicket);
  const [stampedTicket, setStampedTicket] = useState<TicketStub | null>(existingTicket || null);

  const theatrePresets = [
    'BFI IMAX London',
    'Lincoln Square AMC 70mm',
    'Alamo Drafthouse',
    'Le Grand Rex Paris',
    'Film Forum NYC',
    'Private Screening Room',
  ];

  const foilOptions: { id: HolographicFinish; label: string; desc: string; gradient: string }[] = [
    {
      id: 'iridescent',
      label: 'Iridescent Prism',
      desc: 'Multispectral dynamic prism shimmer',
      gradient: 'from-pink-500 via-cyan-400 to-amber-300',
    },
    {
      id: 'gold_leaf',
      label: '24K Gold Leaf',
      desc: 'Rich antique gilded bullion luster',
      gradient: 'from-amber-400 via-yellow-200 to-amber-600',
    },
    {
      id: 'onyx_chrome',
      label: 'Onyx Chrome',
      desc: 'Mirror specular obsidian silver',
      gradient: 'from-neutral-200 via-neutral-400 to-neutral-700',
    },
    {
      id: 'emerald_noir',
      label: 'Emerald Noir',
      desc: 'Deep luminescent jade foil',
      gradient: 'from-emerald-400 via-teal-300 to-emerald-700',
    },
  ];

  const handleStamp = (e: React.FormEvent) => {
    e.preventDefault();
    cinemaAudio.playStamp();

    const year = formatReleaseYear(item);
    const barcode = generateTicketBarcode(item.id, watchDate);

    const newTicket: TicketStub = {
      id: existingTicket?.id || `ticket-${item.id}-${Date.now()}`,
      mediaId: item.id,
      title: item.title,
      year,
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      watchDate,
      rating,
      review: review.trim(),
      theatre,
      seat: seat.toUpperCase(),
      finish,
      barcode,
      mediaType: item.media_type,
      runtime: item.runtime,
      createdAt: existingTicket?.createdAt || Date.now(),
    };

    setStampedTicket(newTicket);
    setIsEditing(false);
    onSaveTicket(newTicket);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl glass-card overflow-hidden border border-white/15 shadow-2xl my-auto z-10">
        {/* Header */}
        <div className="p-5 sm:p-6 glass-panel border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white tracking-wide">
                {isEditing ? 'Stamp Holographic Ticket' : 'Holographic Admission Stub'}
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

        {/* Content Body: Either 3D Interactive Ticket or Creation Form */}
        <div className="p-6">
          {stampedTicket && !isEditing ? (
            <div className="flex flex-col items-center space-y-4">
              <HolographicTicket3D ticket={stampedTicket} />

              <div className="w-full flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-full glass-card border border-white/15 text-xs font-mono-code text-white/80 hover:text-white transition-all"
                >
                  Edit Ticket Data
                </button>

                <button
                  onClick={() => {
                    cinemaAudio.playClick();
                    onClose();
                  }}
                  className="px-6 py-2 rounded-full bg-white text-black font-display font-semibold text-xs tracking-wider uppercase hover:bg-white/90 transition-all"
                >
                  Archived to Vault
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStamp} className="space-y-5">
              {/* Star Rating Selector */}
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

              {/* Theatre & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono-code uppercase text-white/60 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cinema Theatre / Venue</span>
                  </label>
                  <input
                    type="text"
                    value={theatre}
                    onChange={(e) => setTheatre(e.target.value)}
                    required
                    placeholder="e.g. BFI IMAX London"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {theatrePresets.slice(0, 3).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTheatre(p)}
                        className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

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

                  <div className="mt-2">
                    <label className="block text-[10px] font-mono-code uppercase text-white/40 mb-1">
                      Seat Designation
                    </label>
                    <input
                      type="text"
                      value={seat}
                      onChange={(e) => setSeat(e.target.value)}
                      placeholder="e.g. ROW C · SEAT 14"
                      className="w-full px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-white/80 font-mono-code"
                    />
                  </div>
                </div>
              </div>

              {/* Holographic Finish Selector */}
              <div>
                <label className="block text-xs font-mono-code uppercase text-white/60 mb-2">
                  Select Holographic Foil Shader Finish
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {foilOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        cinemaAudio.playClick();
                        setFinish(opt.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                        finish === opt.id
                          ? 'border-amber-400 bg-white/10 shadow-lg'
                          : 'border-white/10 bg-black/30 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-full h-1.5 rounded-full bg-gradient-to-r ${opt.gradient} mb-2`} />
                      <p className="text-xs font-display font-semibold text-white">
                        {opt.label}
                      </p>
                      <p className="text-[10px] font-mono-code text-white/40 leading-tight mt-0.5">
                        {opt.desc}
                      </p>
                      {finish === opt.id && (
                        <Check className="w-3.5 h-3.5 text-amber-400 absolute top-2 right-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Review Notes */}
              <div>
                <label className="block text-xs font-mono-code uppercase text-white/60 mb-1.5">
                  Critic Impressions & Notebook (Printed on Back Face)
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  placeholder="Record your thoughts, standout scenes, technical impressions..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 font-sans resize-none"
                />
              </div>

              {/* Submit Stamp Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black font-display font-bold text-sm tracking-wider uppercase transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Stamp Physical Ticket & Mint Holograph</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
