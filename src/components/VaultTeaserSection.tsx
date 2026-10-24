import React from 'react';
import { TicketStub } from '../types/cinema';
import { getPosterUrl } from '../services/tmdb';
import { cinemaAudio } from '../services/audio';
import { Ticket, Star, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface VaultTeaserSectionProps {
  tickets: TicketStub[];
  onOpenVault: () => void;
  onInspectTicket: (ticket: TicketStub) => void;
}

export const VaultTeaserSection: React.FC<VaultTeaserSectionProps> = ({
  tickets,
  onOpenVault,
  onInspectTicket,
}) => {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 py-16">
      <div className="relative rounded-3xl overflow-hidden glass-card p-6 sm:p-10 border border-white/15 bg-gradient-to-r from-amber-950/20 via-[#0e0e14] to-purple-950/20 shadow-2xl">
        {/* Holographic Sheen Background Accent */}
        <div className="absolute inset-0 holographic-foil opacity-5 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Editorial Copy */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-mono-code uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Personal 3D Admission Archive</span>
            </div>

            <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              The Holographic Ticket Vault
            </h2>

            <p className="text-white/70 text-sm sm:text-base leading-relaxed font-sans">
              Every film you mark as watched is permanently engraved into your personal collection as an interactive, flip-able 3D ticket stub with iridescent foil finishes, seat numbers, and your personal impressions.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  cinemaAudio.playWhoosh();
                  onOpenVault();
                }}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black font-display font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer hover:scale-105"
              >
                <Ticket className="w-4 h-4" />
                <span>Enter 3D Ticket Vault ({tickets.length})</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <div className="flex items-center gap-2 text-xs font-mono-code text-white/50">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Digitally Minted & Preserved</span>
              </div>
            </div>
          </div>

          {/* Right Ticket Preview Stacks */}
          <div className="lg:col-span-6 flex items-center justify-center lg:justify-end">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
              {tickets.slice(0, 2).map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    cinemaAudio.playClick();
                    onOpenVault();
                  }}
                  className="group relative p-4 rounded-2xl glass-panel border border-white/15 hover:border-amber-400/50 transition-all duration-300 hover:-translate-y-2 cursor-pointer shadow-xl"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={getPosterUrl(ticket.posterPath, 'w342')}
                      alt={ticket.title}
                      className="w-16 h-24 object-cover rounded-lg shrink-0 shadow-md bg-black/50"
                    />
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-mono-code text-amber-400 uppercase tracking-wider block truncate">
                        {ticket.theatre}
                      </span>
                      <h4 className="font-display font-bold text-sm text-white truncate mt-0.5">
                        {ticket.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs font-mono-code text-amber-300 mt-1">
                        <Star className="w-3 h-3 fill-amber-300" />
                        <span>{ticket.rating.toFixed(1)}</span>
                        <span className="text-white/40">· {ticket.year}</span>
                      </div>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-mono-code uppercase bg-white/10 text-white/70 border border-white/10">
                        {ticket.finish.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono-code text-white/40">
                    <span className="truncate">{ticket.seat}</span>
                    <span className="text-amber-400/80 group-hover:text-amber-300 font-semibold">
                      Flip in 3D →
                    </span>
                  </div>

                  {/* Holographic sheen glint */}
                  <div className="absolute inset-0 holographic-foil opacity-10 group-hover:opacity-20 pointer-events-none rounded-2xl transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
