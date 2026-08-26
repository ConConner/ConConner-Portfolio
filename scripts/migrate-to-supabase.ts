/**
 * One-time migration of the static JSON content into Supabase.
 *
 * Uploads every asset under public/data/{images,patches,files} to Storage
 * (images re-encoded to WebP, download files as-is) and inserts the rows from
 * src/data/database.json + src/data/timeline.json, rewriting asset paths to
 * their public Storage URLs.
 *
 * Not part of CI — run it by hand:
 *
 *   npm run migrate:supabase -- --dry-run   # list what would happen
 *   npm run migrate:supabase
 *
 * Reads SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY
 * from .env.local. The service-role key bypasses RLS, so it stays local and
 * is never committed or added to CI/Vercel.
 *
 * Re-running is safe: Storage uploads and row inserts both upsert.
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import database from "../src/data/database.json" with { type: "json" };
import timeline from "../src/data/timeline.json" with { type: "json" };
import type { Database, TimelineDatabase } from "../src/data/types";

const IMAGE_BUCKET = "content-images";
const PATCH_BUCKET = "content-patches";

const PUBLIC_DIR = path.join(import.meta.dirname, "..", "public");
/** Source dir -> object key prefix within its bucket. */
const IMAGE_DIRS = { "data/images": "" };
const PATCH_DIRS = { "data/patches": "patches", "data/files": "files" };

const dryRun = process.argv.includes("--dry-run");

try {
  process.loadEnvFile(".env.local");
} catch {
  // Fall back to whatever is already exported in the environment.
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing SUPABASE_URL (or VITE_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Add them to .env.local before running this script.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const db = database as Database;
const tl = timeline as TimelineDatabase;

/** Every file under `dir`, relative to it, skipping dotfiles (.DS_Store). */
const listFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && !e.name.startsWith("."))
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)));
};

const publicUrl = (bucket: string, key: string): string =>
  supabase.storage.from(bucket).getPublicUrl(key).data.publicUrl;

const upload = async (
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> => {
  if (dryRun) return;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(key, body, { contentType, upsert: true });
  if (error) throw new Error(`upload ${bucket}/${key}: ${error.message}`);
};

/**
 * Maps every asset path referenced by the JSON to its new Storage URL, so
 * the row inserts below can rewrite paths without re-deriving them.
 */
const assetUrls = new Map<string, string>();

const migrateImages = async (): Promise<void> => {
  for (const [dir, prefix] of Object.entries(IMAGE_DIRS)) {
    const files = await listFiles(path.join(PUBLIC_DIR, dir));
    for (const file of files) {
      const source = path.join(PUBLIC_DIR, dir, file);
      const key = path.posix.join(
        prefix,
        file.replace(/\.[^.]+$/, ".webp").split(path.sep).join("/"),
      );
      const original = await readFile(source);
      const converted = await sharp(original).webp({ quality: 82 }).toBuffer();
      await upload(IMAGE_BUCKET, key, converted, "image/webp");
      assetUrls.set(`/${dir}/${file.split(path.sep).join("/")}`, publicUrl(IMAGE_BUCKET, key));
      const saved = Math.round((1 - converted.length / original.length) * 100);
      console.log(
        `  image ${dir}/${file} -> ${key} (${saved}% smaller, ${Math.round(converted.length / 1024)}kb)`,
      );
    }
  }
};

const migrateDownloads = async (): Promise<void> => {
  for (const [dir, prefix] of Object.entries(PATCH_DIRS)) {
    const files = await listFiles(path.join(PUBLIC_DIR, dir));
    for (const file of files) {
      const relative = file.split(path.sep).join("/");
      const key = path.posix.join(prefix, relative);
      const body = await readFile(path.join(PUBLIC_DIR, dir, file));
      await upload(PATCH_BUCKET, key, body, "application/octet-stream");
      assetUrls.set(`/${dir}/${relative}`, publicUrl(PATCH_BUCKET, key));
      console.log(`  file  ${dir}/${file} -> ${key}`);
    }
  }
};

/** External links (GitHub releases, nightly.link) are left untouched. */
const resolvePath = (original: string, label: string): string => {
  if (/^https?:\/\//.test(original)) return original;
  const url = assetUrls.get(original);
  if (!url) throw new Error(`${label}: no uploaded asset for "${original}"`);
  return url;
};

const insert = async <T>(table: string, rows: T[]): Promise<void> => {
  if (rows.length === 0) return;
  console.log(`  ${table}: ${rows.length} rows`);
  if (dryRun) return;
  const { error } = await supabase.from(table).upsert(rows as object[]);
  if (error) throw new Error(`insert ${table}: ${error.message}`);
};

const migrateRows = async (): Promise<void> => {
  await insert(
    "games",
    Object.entries(db.games).map(([id, game]) => ({
      id,
      name: game.name,
      console: game.console,
      sha1: game["SHA-1"],
      crc32: game.CRC32,
    })),
  );

  await insert(
    "content_items",
    db.content.map((item, position) => ({
      id: item.id,
      type: item.type,
      // "zm mf" in the JSON means the item targets several games.
      game_ids: item.game ? item.game.split(/\s+/).filter(Boolean) : [],
      name: item.name,
      authors: item.authors,
      description: item.description,
      date: item.date || null,
      // The JSON array order is curated, so it is carried over explicitly.
      position,
    })),
  );

  // Images and downloads are replaced wholesale so a re-run can't duplicate
  // them (both tables use generated ids, so there is nothing to upsert on).
  if (!dryRun) {
    for (const table of ["content_images", "content_downloads"]) {
      const { error } = await supabase
        .from(table)
        .delete()
        .in(
          "content_id",
          db.content.map((item) => item.id),
        );
      if (error) throw new Error(`clear ${table}: ${error.message}`);
    }
  }

  await insert(
    "content_images",
    db.content.flatMap((item) =>
      item.images.map((image, position) => ({
        content_id: item.id,
        url: resolvePath(image, `${item.id} image`),
        position,
      })),
    ),
  );

  await insert(
    "content_downloads",
    db.content.flatMap((item) =>
      item.downloads.map((download) => ({
        content_id: item.id,
        name: download.name,
        path: resolvePath(download.path, `${item.id} download`),
        date: download.date ?? "",
      })),
    ),
  );

  await insert(
    "timeline_entries",
    tl.entries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      name: entry.name,
      description: entry.description,
      image: entry.image ? resolvePath(entry.image, `${entry.id} image`) : null,
    })),
  );
};

const main = async (): Promise<void> => {
  console.log(`${dryRun ? "[dry run] " : ""}Migrating to ${supabaseUrl}\n`);

  console.log("Uploading images (converted to WebP)...");
  await migrateImages();

  console.log("\nUploading patches and files...");
  await migrateDownloads();

  console.log("\nInserting rows...");
  await migrateRows();

  console.log(`\nDone${dryRun ? " (dry run — nothing was written)" : ""}.`);
};

await main();
