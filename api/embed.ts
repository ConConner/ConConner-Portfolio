// Vercel Edge Function. Only reached via the bot redirect in middleware.ts
// (real visitors never see this URL). Renders a minimal HTML document with
// OG/Twitter meta tags for a single content item so link unfurlers (Discord,
// Slack, Twitter, ...) show its image and description without executing JS.
export const config = { runtime: "edge" };

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

export default async function handler(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id") ?? "";
  const pageUrl = new URL(`/projects/${id}`, requestUrl.origin).toString();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey || !id) {
    return Response.redirect(pageUrl, 302);
  }

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

  if (!item) {
    return Response.redirect(pageUrl, 302);
  }

  const image = item.content_images[0]?.url;
  const title = escapeHtml(item.name);
  const description = escapeHtml(truncate(item.description, 280));

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<meta property="og:type" content="website" />
<meta property="og:site_name" content="conconner-portfolio" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${pageUrl}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}
</head>
<body></body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
    },
  });
}
