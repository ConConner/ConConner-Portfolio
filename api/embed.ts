// Vercel Edge Function. Only reached via the unfurler redirect in
// middleware.ts (real visitors and search crawlers never see this URL).
// Renders a minimal HTML document with OG/Twitter meta tags for a single
// content item so link unfurlers (Discord, Slack, Twitter, ...) show its image
// and description without executing JS.
export const config = { runtime: "edge" };

const SITE_NAME = "ConConner's Crazy Content";
const SITE_DESCRIPTION =
  "ROM hacks, tools and experiments by ConConner — mostly Metroid, " +
  "with an in-browser patcher so you can apply them to your own ROM.";

interface ContentImageRow {
  url: string;
  position: number;
}

interface ContentItemRow {
  name: string;
  description: string;
  content_images: ContentImageRow[];
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

const renderCard = (
  { title, description, pageUrl, image }: {
    title: string;
    description: string;
    pageUrl: string;
    image?: string;
  },
): Response => {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(truncate(description, 280));
  const safeImage = image ? escapeHtml(image) : undefined;
  const safeUrl = escapeHtml(pageUrl);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${safeTitle}</title>
<!-- This URL must never be indexed; the canonical points back at the real
     page, which search crawlers reach directly. -->
<meta name="robots" content="noindex, nofollow" />
<link rel="canonical" href="${safeUrl}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:url" content="${safeUrl}" />
${safeImage ? `<meta property="og:image" content="${safeImage}" />` : ""}
<meta name="twitter:card" content="${safeImage ? "summary_large_image" : "summary"}" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
${safeImage ? `<meta name="twitter:image" content="${safeImage}" />` : ""}
</head>
<body><a href="${safeUrl}">${safeTitle}</a></body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
    },
  });
};

export default async function handler(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id") ?? "";
  const pageUrl = new URL(`/projects/${id}`, requestUrl.origin).toString();

  // Every miss below falls back to a site-level card rather than redirecting to
  // /projects/:id: that path is what middleware.ts matches on, so redirecting
  // there would bounce the unfurler straight back here in a loop.
  const fallback = () =>
    renderCard({
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      pageUrl: new URL("/projects", requestUrl.origin).toString(),
    });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey || !id) return fallback();

  const query = new URLSearchParams({
    id: `eq.${id}`,
    select: "name,description,content_images(url,position)",
    "content_images.order": "position.asc",
  });
  const response = await fetch(
    `${supabaseUrl}/rest/v1/content_items?${query}`,
    { headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` } },
  );
  const rows: ContentItemRow[] = response.ok
    ? ((await response.json()) as ContentItemRow[])
    : [];
  const item = rows[0];

  if (!item) return fallback();

  return renderCard({
    title: item.name,
    description: item.description,
    pageUrl,
    image: item.content_images[0]?.url,
  });
}
