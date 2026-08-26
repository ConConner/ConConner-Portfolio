// app/data/db.ts
import { supabase } from "@/lib/supabase";
import type {
  ContentItem,
  Database,
  Game,
  TimelineDatabase,
  TimelineEntry,
  UnifiedTimelineItem,
} from "./types";

// Content is fetched once at app bootstrap (see main.tsx) and kept here, so
// every getter below stays synchronous and callers need no loading state.
const db: Database = { content: [], games: {} };
const tl: TimelineDatabase = { entries: [] };

interface ContentItemRow {
  id: string;
  type: string;
  game_ids: string[];
  name: string;
  authors: string[];
  description: string;
  date: string | null;
  content_images: { url: string; position: number }[];
  content_downloads: { name: string; path: string; date: string }[];
}

interface GameRow {
  id: string;
  name: string;
  console: string;
  sha1: string;
  crc32: string;
}

/**
 * Loads the database into memory. Must resolve before anything calls the
 * getters below. Throws if any query fails, so the caller can show an error
 * instead of rendering an empty site.
 */
export const initDb = async (): Promise<void> => {
  const [content, games, timeline] = await Promise.all([
    supabase
      .from("content_items")
      .select(
        "id, type, game_ids, name, authors, description, date, content_images(url, position), content_downloads(name, path, date)",
      )
      .order("position")
      .order("position", { referencedTable: "content_images" })
      // No curated order on downloads; id keeps them in the order they were
      // inserted, which is the order they were authored in.
      .order("id", { referencedTable: "content_downloads" }),
    supabase.from("games").select("id, name, console, sha1, crc32"),
    supabase
      .from("timeline_entries")
      .select("id, date, name, description, image")
      .order("date", { ascending: false }),
  ]);

  const error = content.error ?? games.error ?? timeline.error;
  if (error) throw new Error(`Failed to load content: ${error.message}`);

  db.content = (content.data as ContentItemRow[]).map((row) => ({
    id: row.id,
    type: row.type,
    // Stored as an array; the rest of the app treats it as the original
    // space-separated string ("zm mf").
    game: row.game_ids.length > 0 ? row.game_ids.join(" ") : null,
    name: row.name,
    authors: row.authors,
    description: row.description,
    images: row.content_images.map((image) => image.url),
    downloads: row.content_downloads.map((download) => ({
      name: download.name,
      path: download.path,
      date: download.date,
    })),
    date: row.date ?? undefined,
  }));

  db.games = Object.fromEntries(
    (games.data as GameRow[]).map((row) => [
      row.id,
      {
        name: row.name,
        console: row.console,
        "SHA-1": row.sha1,
        CRC32: row.crc32,
      } satisfies Game,
    ]),
  );

  tl.entries = (timeline.data as TimelineEntry[]).map((row) => ({
    ...row,
    image: row.image || undefined,
  }));
};

export const getAllContent = (): ContentItem[] => db.content;

export const getContentById = (id: string): ContentItem | undefined =>
  db.content.find((item) => item.id === id);

export const getContentByType = (type: string): ContentItem[] =>
  db.content.filter((item) => item.type === type);

export const getContentByGame = (game: string): ContentItem[] =>
  db.content.filter((item) => item.game === game);

export const getAllGames = (): Record<string, Game> => db.games;

export const getGameById = (id: string): Game | undefined => db.games[id];

export const getGameName = (id: string): string | undefined =>
  db.games[id]?.name;

export const getContentWithGames = () =>
  db.content.map((item) => ({
    ...item,
    gameInfo: db.games[item.game ?? ""],
  }));

export const getTimelineEntries = (): TimelineEntry[] => tl.entries;

/**
 * Picks a representative date for a ContentItem.
 * Priority: explicit `date` -> earliest download date -> undefined.
 */
const getContentDate = (item: ContentItem): string | undefined => {
  if (item.date) return item.date;
  if (item.downloads.length === 0) return undefined;
  return item.downloads
    .map((d) => d.date)
    .sort()
    .at(0);
};

/**
 * Merges ContentItems and TimelineEntries into a single sorted list
 * (newest first).
 */
export const getUnifiedTimeline = (): UnifiedTimelineItem[] => {
  const fromContent: UnifiedTimelineItem[] = db.content
    .map((item): UnifiedTimelineItem | null => {
      const date = getContentDate(item);
      if (!date) return null;
      return {
        id: `content-${item.id}`,
        contentId: item.id,
        date,
        name: item.name,
        description: item.description,
        image: item.images[0],
        source: "content",
      };
    })
    .filter((x): x is UnifiedTimelineItem => x !== null);

  const fromTimeline: UnifiedTimelineItem[] = tl.entries.map((e) => ({
    id: `timeline-${e.id}`,
    date: e.date,
    name: e.name,
    description: e.description,
    image: e.image || undefined,
    source: "timeline",
  }));

  return [...fromContent, ...fromTimeline].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
};
