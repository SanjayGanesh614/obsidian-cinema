import { neon } from '@neondatabase/serverless';
import { MediaItem, WatchedEntry } from '../types/cinema';

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
 * Uses O(N) in-memory deduplication and a single bulk parameterized PostgreSQL query.
 */
export async function saveMediaItemsBatch(items: MediaItem[]): Promise<number> {
  if (!items || items.length === 0) return 0;

  try {
    // 1. In-memory O(N) deduplication: keep highest vote_count per (media_type + title)
    const dedupMap = new Map<string, MediaItem>();
    for (const item of items) {
      if (!item || !item.id || !item.title) continue;
      const mediaType = (item.media_type || 'movie').toLowerCase();
      const key = `${mediaType}:${item.title.trim().toLowerCase()}`;
      const existing = dedupMap.get(key);
      if (!existing || (item.vote_count ?? 0) > (existing.vote_count ?? 0)) {
        dedupMap.set(key, item);
      }
    }

    const cleanItems = Array.from(dedupMap.values());
    if (cleanItems.length === 0) return 0;

    // 2. Query existing titles in DB in 1 single query
    const titles = cleanItems.map((i) => i.title.trim().toLowerCase());
    const existingRows = await sql.query(
      'SELECT id, LOWER(TRIM(title)) as norm_title, media_type, vote_count FROM tmdb_media_cache WHERE LOWER(TRIM(title)) = ANY($1)',
      [titles]
    );

    const existingMap = new Map<string, { id: number; vote_count: number }>();
    for (const r of existingRows as any[]) {
      existingMap.set(`${(r.media_type || 'movie').toLowerCase()}:${r.norm_title}`, {
        id: r.id,
        vote_count: Number(r.vote_count || 0),
      });
    }

    const itemsToInsert: MediaItem[] = [];
    const idsToDelete: number[] = [];

    for (const item of cleanItems) {
      const key = `${(item.media_type || 'movie').toLowerCase()}:${item.title.trim().toLowerCase()}`;
      const existing = existingMap.get(key);

      if (existing) {
        if (existing.id === item.id) {
          itemsToInsert.push(item);
        } else if ((item.vote_count ?? 0) > existing.vote_count) {
          idsToDelete.push(existing.id);
          itemsToInsert.push(item);
        }
        // else: existing is higher quality -> omit inferior duplicate
      } else {
        itemsToInsert.push(item);
      }
    }

    if (idsToDelete.length > 0) {
      await sql.query('DELETE FROM tmdb_media_cache WHERE id = ANY($1)', [idsToDelete]);
    }

    if (itemsToInsert.length === 0) return 0;

    // 3. Single multi-row bulk upsert
    const valuesPlaceholders: string[] = [];
    const params: any[] = [];

    itemsToInsert.forEach((item, index) => {
      const offset = index * 12;
      valuesPlaceholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}::jsonb, $${offset + 12}::jsonb, NOW())`
      );

      const rawJson = JSON.stringify(item);
      const genreIdsJson = JSON.stringify(item.genre_ids || []);
      const releaseDate = item.release_date || item.first_air_date || null;
      const voteAvg = item.vote_average ?? 7.0;
      const voteCount = item.vote_count ?? 100;

      params.push(
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
        rawJson
      );
    });

    const query = `
      INSERT INTO tmdb_media_cache (
        id, media_type, title, original_title, overview, 
        poster_path, backdrop_path, release_date, vote_average, 
        vote_count, genre_ids, raw_data, updated_at
      ) VALUES ${valuesPlaceholders.join(', ')}
      ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        overview = EXCLUDED.overview,
        poster_path = COALESCE(EXCLUDED.poster_path, tmdb_media_cache.poster_path),
        backdrop_path = COALESCE(EXCLUDED.backdrop_path, tmdb_media_cache.backdrop_path),
        vote_average = EXCLUDED.vote_average,
        vote_count = EXCLUDED.vote_count,
        genre_ids = EXCLUDED.genre_ids,
        raw_data = EXCLUDED.raw_data,
        updated_at = NOW()
    `;

    await sql.query(query, params);
    return itemsToInsert.length;
  } catch (err) {
    console.debug('[Neon DB] saveMediaItemsBatch error:', err);
    return 0;
  }
}

/**
 * Enriches cached media record with runtime, director, cast, trailerKey
 */
export async function updateMediaDetailsInDb(id: number, details: Partial<MediaItem>): Promise<void> {
  try {
    const rows = await sql.query('SELECT raw_data FROM tmdb_media_cache WHERE id = $1', [id]);
    if (rows && rows.length > 0) {
      const raw = typeof (rows[0] as any).raw_data === 'string' ? JSON.parse((rows[0] as any).raw_data) : (rows[0] as any).raw_data;
      const updated = { ...raw, ...details };
      await sql.query(
        'UPDATE tmdb_media_cache SET raw_data = $1::jsonb, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updated), id]
      );
    }
  } catch (err) {
    console.debug('[Neon DB] updateMediaDetailsInDb:', err);
  }
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
export async function getNeonDbStats(): Promise<{ mediaCount: number; logsCount: number; watchedCount: number }> {
  try {
    const mediaRes = await sql.query('SELECT COUNT(*) as count FROM tmdb_media_cache');
    const logsRes = await sql.query('SELECT COUNT(*) as count FROM tmdb_api_logs');
    let watchedCount = 0;
    try {
      const watchedRes = await sql.query('SELECT COUNT(*) as count FROM user_watched_movies');
      watchedCount = Number(watchedRes[0]?.count || 0);
    } catch (e) {}
    
    return {
      mediaCount: Number(mediaRes[0]?.count || 0),
      logsCount: Number(logsRes[0]?.count || 0),
      watchedCount,
    };
  } catch (err) {
    return { mediaCount: 0, logsCount: 0, watchedCount: 0 };
  }
}

/**
 * Fetch cached MediaItem records directly from Neon DB (DB-first approach)
 */
export async function getCachedMediaItems(limit: number = 100, genreId?: number, mediaType?: string): Promise<MediaItem[]> {
  try {
    let query = 'SELECT raw_data FROM tmdb_media_cache WHERE 1=1';
    const params: any[] = [];

    if (mediaType && mediaType !== 'all') {
      params.push(mediaType);
      query += ` AND media_type = $${params.length}`;
    }

    if (genreId) {
      params.push(JSON.stringify([genreId]));
      query += ` AND genre_ids @> $${params.length}::jsonb`;
    }

    params.push(limit);
    query += ` ORDER BY updated_at DESC LIMIT $${params.length}`;

    const rows = await sql.query(query, params);
    if (!rows || rows.length === 0) return [];

    return rows
      .map((r: any) => (typeof r.raw_data === 'string' ? JSON.parse(r.raw_data) : r.raw_data))
      .filter((item: MediaItem) => item && (item.poster_path || item.backdrop_path));
  } catch (err) {
    console.debug('[Neon DB] getCachedMediaItems fallback:', err);
    return [];
  }
}

/**
 * Fast DB search for title/overview before calling TMDB API
 */
export async function searchCachedMedia(searchTerm: string, limit: number = 25): Promise<MediaItem[]> {
  if (!searchTerm.trim()) return [];
  try {
    const term = `%${searchTerm.trim().toLowerCase()}%`;
    const rows = await sql.query(
      `SELECT raw_data FROM tmdb_media_cache 
       WHERE LOWER(title) LIKE $1 OR LOWER(overview) LIKE $1
       ORDER BY vote_average DESC LIMIT $2`,
      [term, limit]
    );

    return rows
      .map((r: any) => (typeof r.raw_data === 'string' ? JSON.parse(r.raw_data) : r.raw_data))
      .filter((item: MediaItem) => item && (item.poster_path || item.backdrop_path));
  } catch (err) {
    console.debug('[Neon DB] searchCachedMedia fallback:', err);
    return [];
  }
}

/**
 * Ensure user_watched_movies table exists in Neon PostgreSQL
 */
export async function initWatchedTableIfNotExists(): Promise<void> {
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS user_watched_movies (
        media_id INT PRIMARY KEY,
        rating NUMERIC(3,1) NOT NULL DEFAULT 5.0,
        review TEXT DEFAULT '',
        watch_date TEXT NOT NULL,
        media_item JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.debug('[Neon DB] initWatchedTableIfNotExists warning:', err);
  }
}

/**
 * Fetch all watched entries with their cached media items from Neon DB
 */
export async function getWatchedEntriesFromDb(): Promise<{ entries: WatchedEntry[]; mediaItems: MediaItem[] }> {
  try {
    await initWatchedTableIfNotExists();
    const rows = await sql.query(
      `SELECT media_id, rating, review, watch_date, media_item 
       FROM user_watched_movies 
       ORDER BY updated_at DESC`
    );

    if (!rows || rows.length === 0) {
      return { entries: [], mediaItems: [] };
    }

    const entries: WatchedEntry[] = [];
    const mediaItems: MediaItem[] = [];

    for (const r of rows as any[]) {
      entries.push({
        mediaId: Number(r.media_id),
        rating: Number(r.rating || 5.0),
        review: r.review || '',
        watchDate: r.watch_date || new Date().toISOString().slice(0, 10),
      });

      if (r.media_item) {
        try {
          const parsed = typeof r.media_item === 'string' ? JSON.parse(r.media_item) : r.media_item;
          if (parsed && parsed.id) {
            mediaItems.push(parsed);
          }
        } catch (e) {}
      }
    }

    return { entries, mediaItems };
  } catch (err) {
    console.debug('[Neon DB] getWatchedEntriesFromDb error:', err);
    return { entries: [], mediaItems: [] };
  }
}

/**
 * Persist or update a watched movie entry in Neon DB
 */
export async function saveWatchedEntryToDb(entry: WatchedEntry, mediaItem?: MediaItem): Promise<boolean> {
  try {
    await initWatchedTableIfNotExists();
    const mediaJson = mediaItem ? JSON.stringify(mediaItem) : null;
    await sql.query(
      `INSERT INTO user_watched_movies (
        media_id, rating, review, watch_date, media_item, updated_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
      ON CONFLICT (media_id) DO UPDATE SET 
        rating = EXCLUDED.rating,
        review = EXCLUDED.review,
        watch_date = EXCLUDED.watch_date,
        media_item = COALESCE(EXCLUDED.media_item, user_watched_movies.media_item),
        updated_at = NOW()`,
      [entry.mediaId, entry.rating, entry.review || '', entry.watchDate, mediaJson]
    );

    // Also cache the MediaItem into tmdb_media_cache if present
    if (mediaItem) {
      saveMediaItemsBatch([mediaItem]).catch(() => {});
    }
    return true;
  } catch (err) {
    console.debug('[Neon DB] saveWatchedEntryToDb error:', err);
    return false;
  }
}

/**
 * Delete a watched movie from Neon DB
 */
export async function deleteWatchedEntryFromDb(mediaId: number): Promise<boolean> {
  try {
    await initWatchedTableIfNotExists();
    await sql.query('DELETE FROM user_watched_movies WHERE media_id = $1', [mediaId]);
    return true;
  } catch (err) {
    console.debug('[Neon DB] deleteWatchedEntryFromDb error:', err);
    return false;
  }
}

/**
 * Batch synchronize watched entries to Neon DB
 */
export async function syncWatchedEntriesBatchToDb(
  entries: WatchedEntry[],
  mediaMap: Map<number, MediaItem>
): Promise<void> {
  if (!entries || entries.length === 0) return;
  try {
    for (const entry of entries) {
      const media = mediaMap.get(entry.mediaId);
      await saveWatchedEntryToDb(entry, media);
    }
  } catch (err) {
    console.debug('[Neon DB] syncWatchedEntriesBatchToDb error:', err);
  }
}

