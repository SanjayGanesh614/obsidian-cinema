import React, { useState } from 'react';
import { MediaItem, MoodCategory } from '../types/cinema';
import { CINEMA_MOODS } from '../data/cinemaMoods';
import { getPosterUrl, getBackdropUrl } from '../services/tmdb';
import { formatReleaseYear } from '../utils/pure';
import { cinemaAudio } from '../services/audio';
import { Sparkles, Star, Play, Check, ArrowRight, Film } from 'lucide-react';

interface MoodsSectionProps {
  items: MediaItem[];
  onSelectMovie: (item: MediaItem) => void;
  onPlayTrailer: (item: MediaItem) => void;
  onToggleWatched: (item: MediaItem) => void;
  onMoodSelect?: (mood: MoodCategory) => void;
}

export const MoodsSection: React.FC<MoodsSectionProps> = ({
  items,
  onSelectMovie,
  onPlayTrailer,
  onToggleWatched,
  onMoodSelect,
}) => {
  const [selectedMoodId, setSelectedMoodId] = useState<string>(CINEMA_MOODS[0].id);

  const activeMood = CINEMA_MOODS.find((m) => m.id === selectedMoodId) || CINEMA_MOODS[0];

  // Find media items matching the active mood
  const moodItems = React.useMemo(() => {
    // Exact sample IDs match
    const exact = items.filter((m) => activeMood.sampleIds.includes(m.id));
    // Complementary matches
    const extra = items.filter((m) => !activeMood.sampleIds.includes(m.id));
    return [...exact, ...extra].slice(0, 6);
  }, [items, activeMood]);

  const handleSelectMood = (mood: MoodCategory) => {
    cinemaAudio.playWhoosh();
    setSelectedMoodId(mood.id);
    onMoodSelect?.(mood);
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 py-14 border-b border-white/5">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-widest mb-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Atmospheric Resonance</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white">
            Curated Cinema Moods
          </h2>
          <p className="text-white/60 text-sm max-w-xl font-sans mt-1">
            Navigate cinema not by rigid genres, but by psychological frequency, aesthetic temperature, and poetic weight.
          </p>
        </div>

        {/* Mood Pills Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CINEMA_MOODS.map((mood) => {
            const isSelected = mood.id === selectedMoodId;
            return (
              <button
                key={mood.id}
                onClick={() => handleSelectMood(mood)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono-code whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-white text-black font-bold shadow-lg shadow-white/20'
                    : 'glass-card text-white/60 hover:text-white hover:border-white/30'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: mood.color }}
                />
                <span>{mood.name.split('&')[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Showcase for the Selected Mood */}
      <div
        className="relative rounded-3xl overflow-hidden glass-card p-6 sm:p-10 border border-white/10 transition-all duration-700 mb-8"
        style={{
          background: `radial-gradient(ellipse at 80% 20%, ${activeMood.color}25 0%, rgba(14, 14, 18, 0.85) 60%)`,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Editorial Copy */}
          <div className="lg:col-span-5 space-y-4">
            <span
              className="px-3 py-1 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider border"
              style={{
                color: activeMood.color,
                borderColor: `${activeMood.color}40`,
                backgroundColor: `${activeMood.color}15`,
              }}
            >
              {activeMood.badge}
            </span>

            <h3 className="font-cinzel text-2xl sm:text-3xl font-black text-white leading-tight">
              {activeMood.name}
            </h3>

            <p className="text-amber-200/80 font-display italic text-sm">
              "{activeMood.tagline}"
            </p>

            <p className="text-white/70 text-sm leading-relaxed font-sans">
              {activeMood.description}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs font-mono-code text-white/40">
                Curated selection for this atmosphere:
              </span>
            </div>
          </div>

          {/* Right Curated Title Grid for this Mood */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {moodItems.map((movie) => {
              const year = formatReleaseYear(movie);
              const posterUrl = getPosterUrl(movie.poster_path, 'w500');

              return (
                <div
                  key={movie.id}
                  onClick={() => {
                    cinemaAudio.playClick();
                    onSelectMovie(movie);
                  }}
                  className="group relative rounded-2xl overflow-hidden glass-card p-2 border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shadow-xl"
                >
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-black/50">
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                    {/* Rating Pill */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full glass-panel border border-white/20 text-[10px] font-mono-code text-amber-300 flex items-center gap-1 shadow-md">
                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                      <span>{movie.vote_average.toFixed(1)}</span>
                    </div>

                    {/* Quick actions on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cinemaAudio.playClick();
                          onPlayTrailer(movie);
                        }}
                        className="p-2.5 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-lg"
                        title="Watch Trailer"
                      >
                        <Play className="w-3.5 h-3.5 fill-black translate-x-0.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cinemaAudio.playClick();
                          onToggleWatched(movie);
                        }}
                        className="p-2.5 rounded-full bg-amber-400 text-black hover:bg-amber-300 transition-transform shadow-lg font-bold"
                        title="Mark as Watched"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 px-1">
                    <h4 className="font-display font-medium text-xs text-white truncate group-hover:text-amber-300 transition-colors">
                      {movie.title}
                    </h4>
                    <p className="text-[10px] font-mono-code text-white/40 mt-0.5">
                      {year} · <span className="uppercase">{movie.media_type}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
