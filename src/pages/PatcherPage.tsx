import { ImageMarquee } from "@/components/ImageMarquee";
import Patcher from "@/components/Patcher";
import { getContentById, getContentByType } from "@/data/db";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useSeo } from "@/lib/seo";
import type { ContentItem } from "@/data/types";

const projectHref = (itemId: string) => `/projects/${itemId}`;

// Formats RomPatcher.js can apply. Downloads are a mix of real patch files and
// external release links (GitHub, nightly.link), and only the former can be fed
// to the engine.
const PATCH_EXTENSIONS =
  /\.(ips|bps|ups|aps|rup|ebp|xdelta|vcdiff|zip)$/i;

/**
 * Patch to apply when the URL carries no ?path= — the newest patch file on the
 * item. Without this, /patch/:hackId on its own is an error page, which is the
 * URL the sitemap advertises and every ?path= variant canonicalises to.
 */
const defaultPatchPath = (item: ContentItem | undefined): string | null => {
  if (!item) return null;
  const patches = item.downloads.filter((download) =>
    PATCH_EXTENSIONS.test(download.path)
  );
  if (patches.length === 0) return null;
  return [...patches].sort((a, b) => b.date.localeCompare(a.date))[0].path;
};

export default function PatcherPage() {
  const [searchParams] = useSearchParams();
  const { hackId } = useParams<{ hackId: string }>();
  const otherHacks = getContentByType("hack");
  const item = hackId ? getContentById(hackId) : undefined;
  const patchPath = searchParams.get("path") ?? defaultPatchPath(item);

  // Canonical deliberately drops the ?path= query: the UI links here with a
  // different patch file per release, which would otherwise look like several
  // near-duplicate pages competing for the same "patch <hack> online" query.
  useSeo({
    title: item ? `Patch ${item.name} online` : "Patch a ROM online",
    description: item
      ? `Apply the ${item.name} patch to your own ROM straight in the ` +
        "browser — nothing is uploaded, the patching happens on your machine."
      : "Apply a patch to your own ROM straight in the browser — nothing is " +
        "uploaded, the patching happens on your machine.",
    canonicalPath: hackId ? `/patch/${hackId}` : undefined,
    image: item?.images[0],
    noindex: !item || !patchPath,
  });

  return (
    <div className="flex flex-col gap-2">
      <Patcher hackId={hackId} patchPath={patchPath} />

      {item && (
        <p className="text-center text-sm text-muted-foreground">
          Read more about{" "}
          <Link to={projectHref(item.id)} className="underline">
            {item.name}
          </Link>
          .
        </p>
      )}

      <span className="text-muted-foreground text-center">
        Also try these hacks...
      </span>
      <ImageMarquee
        items={otherHacks}
        speed={1000}
        pauseOnHover
        hrefForItem={projectHref}
      />
    </div>
  );
}
