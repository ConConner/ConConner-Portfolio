// Vercel Edge Function, served at /sitemap.xml via the rewrite in vercel.json.
//
// This is the only way a crawler can discover the project and blog pages: the
// site renders client-side, so there is no static HTML anywhere that lists
// them. Generated per request rather than at build time so content added
// through the admin panel is discoverable without a redeploy.
export const config = { runtime: "edge" };

const SITE_URL = "https://www.conconner.com";

interface ContentRow {
  id: string;
  type: string;
  date: string | null;
  content_downloads: { date: string; path: string }[];
}

// Kept in sync with PATCH_EXTENSIONS in src/pages/PatcherPage.tsx. A hack whose
// only downloads are external release links has no patch to apply, so its
// /patch/ page is an error page and must stay out of the sitemap.
const PATCH_EXTENSIONS = /\.(ips|bps|ups|aps|rup|ebp|xdelta|vcdiff|zip)$/i;

interface BlogRow {
  id: string;
  date: string;
}

interface SitemapUrl {
  path: string;
  lastmod?: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * `content_downloads.date` is free-form text — real rows include partial dates
 * ("2018-12") and empty strings for external release links — so anything that
 * is not a full ISO date is dropped rather than guessed at. An invalid
 * <lastmod> invalidates the whole sitemap for some crawlers.
 */
const toLastmod = (...candidates: (string | null | undefined)[]): string | undefined => {
  const valid = candidates
    .filter((value): value is string => !!value && /^\d{4}-\d{2}-\d{2}/.test(value))
    .map((value) => value.slice(0, 10))
    .sort();
  return valid.at(-1);
};

const renderUrl = ({ path, lastmod, changefreq, priority }: SitemapUrl): string =>
  [
    "  <url>",
    `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");

export default async function handler(): Promise<Response> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  const urls: SitemapUrl[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/projects", changefreq: "weekly", priority: "0.9" },
    { path: "/blog", changefreq: "weekly", priority: "0.7" },
  ];

  if (supabaseUrl && anonKey) {
    const headers = { apikey: anonKey, authorization: `Bearer ${anonKey}` };
    const [contentRes, blogRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/content_items?select=id,type,date,content_downloads(date,path)`,
        { headers },
      ),
      fetch(`${supabaseUrl}/rest/v1/blog_posts?select=id,date`, { headers }),
    ]);

    const content: ContentRow[] = contentRes.ok
      ? ((await contentRes.json()) as ContentRow[])
      : [];
    const blog: BlogRow[] = blogRes.ok
      ? ((await blogRes.json()) as BlogRow[])
      : [];

    for (const item of content) {
      const lastmod = toLastmod(
        item.date,
        ...item.content_downloads.map((download) => download.date),
      );
      urls.push({
        path: `/projects/${item.id}`,
        lastmod,
        changefreq: "monthly",
        priority: "0.8",
      });
      // The patcher page for a hack is a real landing page ("patch <hack>
      // online"), so it is listed without the ?path= query the UI adds — the
      // page canonicalises to this bare URL and defaults to the newest patch.
      const hasPatch = item.content_downloads.some((download) =>
        PATCH_EXTENSIONS.test(download.path)
      );
      if (item.type === "hack" && hasPatch) {
        urls.push({
          path: `/patch/${item.id}`,
          lastmod,
          changefreq: "monthly",
          priority: "0.5",
        });
      }
    }

    for (const post of blog) {
      urls.push({
        path: `/blog/${post.id}`,
        lastmod: toLastmod(post.date),
        changefreq: "yearly",
        priority: "0.6",
      });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(renderUrl).join("\n")}
</urlset>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=3600",
    },
  });
}
