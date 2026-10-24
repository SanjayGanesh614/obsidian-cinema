import React, { useState } from 'react';
import { TicketStub } from '../types/cinema';
import { calculateVaultStats } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { HolographicTicket3D } from './three/HolographicTicket3D';
import {
  Ticket,
  Star,
  Clock,
  Sparkles,
  Calendar,
  MapPin,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';

interface TicketVaultViewProps {
  tickets: TicketStub[];
  onDeleteTicket: (ticketId: string) => void;
  onClose: () => void;
}

export const TicketVaultView: React.FC<TicketVaultViewProps> = ({
  tickets,
  onDeleteTicket,
  onClose,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<TicketStub | null>(tickets[0] || null);
  const stats = calculateVaultStats(tickets);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Vault Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Personal Admission Archive</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white">
            The Holographic Ticket Vault
          </h2>
          <p className="text-white/60 text-sm font-sans mt-1">
            Each stamped admission stub is permanently minted with custom review impressions, theatre seating, and iridescent optical foil.
          </p>
        </div>

        <button
          onClick={() => {
            cinemaAudio.playClick();
            onClose();
          }}
          className="px-4 py-2 rounded-full glass-card border border-white/15 text-xs font-mono-code text-white/70 hover:text-white transition-all flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          <span>Exit Vault</span>
        </button>
      </div>

      {/* Aggregate Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-xs font-mono-code uppercase mb-1">
            <Ticket className="w-3.5 h-3.5 text-amber-400" />
            <span>Stamped Tickets</span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-white">
            {stats.totalTickets}
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-xs font-mono-code uppercase mb-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Average Score</span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-amber-300">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'} / 5.0
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-xs font-mono-code uppercase mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Cinema Hours</span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-white">
            {stats.totalRuntimeHours} hrs
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-xs font-mono-code uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Dominant Foil</span>
          </div>
          <p className="font-display text-lg sm:text-xl font-bold text-purple-300 truncate">
            {stats.topFinish}
          </p>
        </div>
      </div>

      {/* Main Vault Split View: Left Gallery List, Right Interactive 3D Viewer */}
      {tickets.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl border border-white/10 p-8">
          <Ticket className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <h3 className="font-cinzel text-xl text-white font-bold">Your Vault is Empty</h3>
          <p className="text-white/50 text-sm max-w-md mx-auto mt-1 mb-4">
            Mark any movie as "Watched" from the 3D gallery or search to mint your first holographic ticket stub.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Stamped Ticket List Grid */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-xs font-mono-code text-white/50 uppercase tracking-widest mb-2">
              Select a Ticket to Inspect in 3D
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {tickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      cinemaAudio.playClick();
                      setSelectedTicket(ticket);
                    }}
                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-white/10 shadow-xl'
                        : 'glass-card border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 overflow-hidden">
                        <span className="text-[10px] font-mono-code text-amber-400 uppercase tracking-wider">
                          {ticket.theatre}
                        </span>
                        <h4 className="font-display font-bold text-base text-white truncate">
                          {ticket.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-mono-code text-white/50 mt-1">
                          <span>{ticket.year}</span>
                          <span>·</span>
                          <span className="text-amber-300 font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-300" />
                            <span>{ticket.rating.toFixed(1)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Foil Badge */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code uppercase bg-white/10 border border-white/15 text-white/80 shrink-0">
                        {ticket.finish.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono-code text-white/40">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3 h-3" />
                        <span>{ticket.watchDate}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cinemaAudio.playClick();
                          onDeleteTicket(ticket.id);
                        }}
                        className="p-1 hover:text-red-400 transition-colors"
                        title="Delete ticket stub"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Holographic foil glimmer on card */}
                    <div className="absolute inset-0 holographic-foil opacity-10 pointer-events-none rounded-2xl" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Interactive 3D Holographic Stub Viewer */}
          <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-white/15 shadow-2xl flex flex-col items-center">
            {selectedTicket ? (
              <>
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-mono-code text-amber-400 uppercase tracking-wider">
                    Interactive 3D Holographic Specimen
                  </span>
                  <span className="text-[11px] font-mono-code text-white/40">
                    Drag to rotate · Flip for review
                  </span>
                </div>

                <HolographicTicket3D ticket={selectedTicket} />

                {/* Stamped Review Notes Callout */}
                <div className="w-full mt-4 p-4 rounded-2xl bg-black/40 border border-white/10">
                  <p className="text-[11px] font-mono-code text-white/50 uppercase mb-1">
                    Critic's Journal Entry
                  </p>
                  <p className="text-sm font-sans text-white/90 italic leading-relaxed">
                    "{selectedTicket.review}"
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono-code text-white/40">
                    <span>{selectedTicket.seat}</span>
                    <span>{selectedTicket.barcode}</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
