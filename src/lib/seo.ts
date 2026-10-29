import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Production origin. The apex domain 308-redirects to www, so www is the
// canonical host and every canonical/og:url must use it — otherwise every
// page advertises a URL that redirects, which splits its ranking signals.
export const SITE_URL = "https://www.conconner.com";
export const SITE_NAME = "ConConner's Crazy Content";

export const DEFAULT_DESCRIPTION =
  "ROM hacks, tools and experiments by ConConner — mostly Metroid, " +
  "with an in-browser patcher so you can apply them to your own ROM.";

// Every tag this module writes is marked, so a route change can clear the
// previous page's tags without touching the ones in index.html.
const MANAGED_ATTR = "data-seo";

interface SeoOptions {
  /** Page title. The site name is appended unless it already is the title. */
  title: string;
  description?: string;
  /** Canonical path, defaulting to the current location. Pass this to strip
   *  query params that produce duplicate URLs for the same page. */
  canonicalPath?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const setMeta = (
  key: "name" | "property",
  value: string,
  content: string,
): void => {
  const tag = document.createElement("meta");
  tag.setAttribute(key, value);
  tag.setAttribute("content", content);
  tag.setAttribute(MANAGED_ATTR, "");
  document.head.appendChild(tag);
};

/**
 * Keeps the document head in sync with the current route: title, description,
 * canonical, Open Graph/Twitter tags and optional JSON-LD.
 *
 * This runs client-side, which Googlebot handles (it indexes the rendered DOM),
 * but it is why `api/sitemap.ts` exists — crawlers still need a static list of
 * URLs to discover these pages in the first place.
 */
export function useSeo(
  {
    title,
    description = DEFAULT_DESCRIPTION,
    canonicalPath,
    image,
    type = "website",
    noindex = false,
    jsonLd,
  }: SeoOptions,
): void {
  const { pathname } = useLocation();
  const canonical = `${SITE_URL}${canonicalPath ?? pathname}`;
  // Serialised so the effect compares by value; callers build these inline and
  // would otherwise hand us a new object identity on every render.
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
    document.title = fullTitle;

    for (const stale of document.head.querySelectorAll(`[${MANAGED_ATTR}]`)) {
      stale.remove();
    }

    setMeta("name", "description", description);
    setMeta(
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    );

    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = canonical;
    link.setAttribute(MANAGED_ATTR, "");
    document.head.appendChild(link);

    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonical);
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    if (image) {
      setMeta("property", "og:image", image);
      setMeta("name", "twitter:image", image);
    }

    if (jsonLdText) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = jsonLdText;
      script.setAttribute(MANAGED_ATTR, "");
      document.head.appendChild(script);
    }
  }, [title, description, canonical, image, type, noindex, jsonLdText]);
}

/** Trims a body of text down to something usable as a meta description. */
export const toDescription = (value: string, max = 160): string => {
  const flat = value.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
};
