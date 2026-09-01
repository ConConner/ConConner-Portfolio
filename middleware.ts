// Vercel Edge Middleware. Runs ahead of the SPA catch-all rewrite in
// vercel.json. Real browsers fall through untouched (return undefined);
// link-unfurling bots get redirected to /api/embed, which serves static
// OG/Twitter meta tags for the project instead of the JS-only SPA shell.
export const config = {
  matcher: "/projects/:id",
};

const BOT_USER_AGENT =
  /discordbot|facebookexternalhit|twitterbot|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|pinterest|skypeuripreview|vkshare|applebot|google-inspectiontool|w3c_validator|iframely|embedly|bot|crawl|spider|preview/i;

export default function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!BOT_USER_AGENT.test(userAgent)) return;

  const id = new URL(request.url).pathname.split("/").pop() ?? "";
  return Response.redirect(
    new URL(`/api/embed?id=${encodeURIComponent(id)}`, request.url),
    302,
  );
}
