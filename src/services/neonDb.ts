import { neon } from '@neondatabase/serverless';
import { MediaItem } from '../types/cinema';

const DATABASE_URL = 
  import.meta.env?.VITE_NEON_DATABASE_URL || 
  'postgresql://neondb_owner:npg_eL7Q5CxoFUzX@ep-proud-sea-b77eyg8o-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Initialize the neon client with SSL enabled
const sql = neon(DATABASE_URL);

/**
 * Log every TMDB API call into Neon database tmdb_api_logs table
 */
export async function logTMDBApiCall(
  endpoint: string, 
  queryParams: Record<string, any> = {}, 
  resultsCount: number = 0,
  payloadPreview?: any
): Promise<void> {
  try {
    const paramsJson = JSON.stringify(queryParams);
    const previewJson = payloadPreview ? JSON.stringify(payloadPreview).slice(0, 4000) : null;

    await sql.query(
      `INSERT INTO tmdb_api_logs (endpoint, query_params, results_count, payload_preview, created_at)
       VALUES ($1, $2::jsonb, $3, $4::jsonb, NOW())`,
      [endpoint, paramsJson, resultsCount, previewJson]
    );
  } catch (err) {
    // Non-blocking error logging for high resilience
    console.debug('[Neon DB] api_log skipped or offline:', err);
  }
}

/**
 * Save / Upsert a batch of MediaItem records into Neon DB tmdb_media_cache
 */
export async function saveMediaItemsBatch(items: MediaItem[]): Promise<number> {
  if (!items || items.length === 0) return 0;
  let savedCount = 0;

  // Process items in chunks of 5 to avoid query limits
  const CHUNK_SIZE = 5;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    await Promise.allSettled(
      chunk.map(async (item) => {
        try {
          const rawJson = JSON.stringify(item);
          const genreIdsJson = JSON.stringify(item.genre_ids || []);
          const releaseDate = item.release_date || item.first_air_date || null;
          const voteAvg = item.vote_average ?? 7.0;
          const voteCount = item.vote_count ?? 100;

          await sql.query(
            `INSERT INTO tmdb_media_cache (
              id, media_type, title, original_title, overview, 
              poster_path, backdrop_path, release_date, vote_average, 
              vote_count, genre_ids, raw_data, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, NOW()
            ) ON CONFLICT (id) DO UPDATE SET 
              title = EXCLUDED.title,
              overview = EXCLUDED.overview,
              poster_path = COALESCE(EXCLUDED.poster_path, tmdb_media_cache.poster_path),
              backdrop_path = COALESCE(EXCLUDED.backdrop_path, tmdb_media_cache.backdrop_path),
              vote_average = EXCLUDED.vote_average,
              vote_count = EXCLUDED.vote_count,
              genre_ids = EXCLUDED.genre_ids,
              raw_data = EXCLUDED.raw_data,
              updated_at = NOW()`,
            [
              item.id,
              item.media_type || 'movie',
              item.title,
              item.original_title || item.title,
              item.overview || '',
              item.poster_path || null,
              item.backdrop_path || null,
              releaseDate,
              voteAvg,
              voteCount,
              genreIdsJson,
              rawJson,
            ]
          );
          savedCount++;
        } catch (e) {
          // Ignore individual row error to guarantee pipeline continuity
        }
      })
    );
  }

  return savedCount;
}

/**
 * Register genres catalog in Neon DB
 */
export async function syncGenresToDb(genres: { id: number; name: string; media_type: string }[]): Promise<void> {
  try {
    for (const g of genres) {
      await sql.query(
        `INSERT INTO tmdb_genres_catalog (id, media_type, name, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (id, media_type) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
        [g.id, g.media_type, g.name]
      );
    }
  } catch (err) {
    console.debug('[Neon DB] genres sync:', err);
  }
}

/**
 * Get live stats from Neon DB (cached media count and API log count)
 */
export async function getNeonDbStats(): Promise<{ mediaCount: number; logsCount: number }> {
  try {
    const mediaRes = await sql.query('SELECT COUNT(*) as count FROM tmdb_media_cache');
    const logsRes = await sql.query('SELECT COUNT(*) as count FROM tmdb_api_logs');
    
    return {
      mediaCount: Number(mediaRes[0]?.count || 0),
      logsCount: Number(logsRes[0]?.count || 0),
    };
  } catch (err) {
    return { mediaCount: 0, logsCount: 0 };
  }
}
