import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllBlogPosts } from "@/data/db";
import { SITE_URL, useSeo } from "@/lib/seo";
import type { BlogPost } from "@/data/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const BlogCard = memo(function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.id}`}
      aria-label={post.title}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="group flex h-full cursor-pointer flex-col overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
        {post.coverImage && (
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              src={post.coverImage}
              alt={post.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <CardHeader className="p-4 pb-0">
          <CardTitle className="line-clamp-2 text-left text-base leading-tight">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 text-left">
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        </CardContent>
        <CardFooter className="mt-auto p-4 pt-0 text-left">
          <p className="text-xs text-muted-foreground">{formatDate(post.date)}</p>
        </CardFooter>
      </Card>
    </Link>
  );
});

export default function Blog() {
  const posts = getAllBlogPosts();

  useSeo({
    title: "Blog",
    description:
      "Write-ups on ROM hacking, reverse engineering and the tools behind " +
      "the projects.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Blog",
      url: `${SITE_URL}/blog`,
      blogPost: posts.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        url: `${SITE_URL}/blog/${post.id}`,
        datePublished: post.date,
      })),
    },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4">
      <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
      {posts.length === 0
        ? (
          <p className="text-muted-foreground">Nothing posted yet.</p>
        )
        : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
    </div>
  );
}
