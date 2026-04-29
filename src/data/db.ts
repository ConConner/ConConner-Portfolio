// app/data/db.ts
import database from "./database.json";
import timeline from "./timeline.json";
import type {
  ContentItem,
  Database,
  Game,
  TimelineDatabase,
  TimelineEntry,
  UnifiedTimelineItem,
} from "./types";

const db: Database = database;
const tl: TimelineDatabase = timeline;

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