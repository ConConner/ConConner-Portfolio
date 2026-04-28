import database from "./database.json";
import type { ContentItem, Database, Game } from "./types";

const db: Database = database;

export const getAllContent = (): ContentItem[] => db.content;

export const getContentById = (id: string): ContentItem | undefined =>
  db.content.find((item) => item.id === id);

export const getContentByType = (type: string): ContentItem[] =>
  db.content.filter((item) => item.type === type);

export const getContentByGame = (game: string): ContentItem[] =>
  db.content.filter((item) => item.game === game);

export const getAllGames = (): Record<string, Game> => db.games;

export const getGameById = (id: string): Game | undefined => db.games[id];

export const getGameName = (id: string): string | undefined => db.games[id]?.name;

export const getContentWithGames = () =>
  db.content.map((item) => ({
    ...item,
    gameInfo: db.games[item.game ?? ""],
  }));