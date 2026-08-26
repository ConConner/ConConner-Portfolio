import { supabase } from "@/lib/supabase";

const IMAGE_BUCKET = "content-images";
const PATCH_BUCKET = "content-patches";

/** `My Patch v1.0.ips` -> `my-patch-v1-0` */
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "file";

/**
 * Re-encodes an image to WebP in the browser, so everything uploaded from
 * here matches the WebP assets the one-time migration produced. No extra
 * dependency needed — canvas can encode WebP natively.
 */
const toWebp = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get a 2D canvas context");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82),
  );
  if (!blob) throw new Error(`Could not convert ${file.name} to WebP`);
  return blob;
};

const upload = async (
  bucket: string,
  key: string,
  body: Blob,
  contentType: string,
): Promise<string> => {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(key, body, { contentType, upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from(bucket).getPublicUrl(key).data.publicUrl;
};

/** Converts to WebP and uploads under the content item's own folder. */
export const uploadImage = async (
  contentId: string,
  file: File,
): Promise<string> => {
  const webp = await toWebp(file);
  const key = `${contentId || "misc"}/${slugify(file.name)}-${Date.now()}.webp`;
  return upload(IMAGE_BUCKET, key, webp, "image/webp");
};

/** Patches are binary (IPS/BPS/zip) and are uploaded untouched. */
export const uploadPatch = async (file: File): Promise<string> => {
  const key = `patches/${file.name}`;
  return upload(PATCH_BUCKET, key, file, "application/octet-stream");
};
