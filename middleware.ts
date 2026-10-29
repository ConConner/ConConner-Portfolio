// Vercel Edge Middleware. Runs ahead of the SPA catch-all rewrite in
// vercel.json. Real browsers fall through untouched (return undefined);
// link-unfurling bots get redirected to /api/embed, which serves static
// OG/Twitter meta tags for the project instead of the JS-only SPA shell.
export const config = {
  matcher: "/projects/:id",
};

// Named unfurlers only, and deliberately an allowlist. A generic `bot|crawl|
// spider` pattern also matches Googlebot, bingbot, Applebot and friends, which
// sent every search crawler to /api/embed — a document with an empty <body> —
// so no project page could ever be indexed. Search crawlers must fall through
// to the SPA, which they render and index; see src/lib/seo.ts.
const UNFURLER_USER_AGENT =
  /discordbot|facebookexternalhit|facebookcatalog|twitterbot|slackbot|slack-imgproxy|telegrambot|whatsapp|linkedinbot|redditbot|pinterest|skypeuripreview|vkshare|iframely|embedly|mastodon|bluesky|flipboard|tumblr|nuzzel|qwantify/i;

export default function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!UNFURLER_USER_AGENT.test(userAgent)) return;

  const id = new URL(request.url).pathname.split("/").pop() ?? "";
  return Response.redirect(
    new URL(`/api/embed?id=${encodeURIComponent(id)}`, request.url),
    302,
  );
}
