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