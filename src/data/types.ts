export interface Download {
  name: string;
  path: string;
  date: string;
}

export interface ContentItem {
  id: string;
  type: "hack" | "tool" | string;
  game: string | null;
  name: string;
  authors: string[];
  description: string;
  images: string[];
  downloads: Download[];
  date?: string;
}

export interface Game {
    name: string,
    console: string,
    "SHA-1": string,
    CRC32: string,
}

export interface Database {
  content: ContentItem[];
  games: Record<string, Game>;
}

export interface TimelineEntry {
  id: string;
  date: string;
  name: string;
  description: string;
  image?: string;
}

export interface TimelineDatabase {
  entries: TimelineEntry[];
}

export interface UnifiedTimelineItem {
  id: string;
  date: string;
  name: string;
  description: string;
  image?: string;
  source: "content" | "timeline";
  contentId?: string;
}