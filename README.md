# 🎬 Obsidian Cinema — 3D Film Curation & Holographic Cinema Vault

> An ultra-premium movie and television curation platform built with cutting-edge 3D UI, WebGL liquid lens optics, fluid masonry physics, and serverless database persistence.

![Obsidian Cinema Banner](https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop)

---

## 🌟 Key Features

### 1. DriftWall 3D Landing Experience
* **React Bits DriftWall**: 3D perspective scrolling wall with alternating column drift velocities, pointer parallax tilt, and ambient poster glow.
* **Ambient Lighting Mesh**: Extracts dominant color hues from active posters and casts soft cinematic ambient reflections.
* **Hero Spotlight**: High-impact editorial hero banner with live trailers, ratings, and instant watchlist curation.

### 2. Architectural Genre Reels (3D Dial & WebGL Liquid Flex Carousel)
* **3D OptionWheel Dial**: Curved circular selector on the left pane allowing intuitive drag, wheel, and keyboard browsing through all 35 film & TV genres.
* **WebGL FlexCarousel (OGL)**: Liquid lens shaders featuring chromatic dispersion, dynamic curvature bend, and focus-on-click focal zoom.
* **All 35 TMDB Genres Covered**: Complete live metadata, posters, release years, and vote scores across 19 feature film categories and 16 television series categories.

### 3. My Watched Movies (React Bits Masonry Wall)
* **Fluid Staggered Masonry**: Staggered Pinterest/A24-style masonry layout displaying watched films with spring physics and organic variable heights.
* **Interactive Lightbox & Draggable Reordering**: Click any title to launch full-screen high-resolution inspection or drag tiles to curate personal watch sequences.
* **Telemetry Metrics**: Live metrics for Total Titles Watched, Average Rating (out of 5.0), and Screen Time hours.

### 4. Neon Serverless PostgreSQL Persistence Layer
* **Automated Non-Blocking DB Auditing**: Every TMDB API call (`fetchTrending`, `fetchTopRated`, `searchTMDB`, `fetchMediaByGenre`) is logged to `tmdb_api_logs` in Neon DB.
* **Media Cache**: Returned movie and TV series records are automatically upserted into `tmdb_media_cache` over Neon HTTP serverless connection.
* **Live DB Telemetry**: Real-time counter badge displaying active project ID, cached titles count, and logged calls count.

### 5. Mechanical Audio Sensory Polish
* **Cinema Audio Engine**: Web Audio synthesizer generating authentic film-reel mechanical clicks, tape whooshes, and vintage 35mm projector motor hums.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18+ or v20+)
* **pnpm** (recommended) or **npm**

### Installation

```bash
# Clone the repository
git clone https://github.com/SanjayGanesh614/obsidian-cinema.git
cd obsidian-cinema

# Install dependencies
pnpm install
```

### Environment Configuration

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Configure your variables:
```env
# Optional Gemini API Key
GEMINI_API_KEY="your_api_key_here"

# Neon Serverless PostgreSQL Database URL
VITE_NEON_DATABASE_URL="postgresql://user:password@endpoint.region.aws.neon.tech/neondb?sslmode=require"
```

### Development Server

```bash
pnpm run dev
```

Visit `http://localhost:3000` to explore Obsidian Cinema.

### Production Build

```bash
pnpm run build
pnpm run preview
```

---

## 🛠 Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite 8
* **Creative Coding & 3D**: Three.js, OGL (WebGL 2), React Bits (`DriftWall`, `OptionWheel`, `FlexCarousel`, `Masonry`)
* **Motion & Icons**: Motion, Lucide React, Hugeicons
* **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
* **API**: The Movie Database (TMDB) API

---

## 📜 License

Apache-2.0
