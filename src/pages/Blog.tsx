import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllBlogPosts } from "@/data/db";
import type { BlogPost } from "@/data/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const BlogCard = memo(function BlogCard({
  post,
  onClick,
}: {
  post: BlogPost;
  onClick: (post: BlogPost) => void;
}) {
  const handleClick = useCallback(() => onClick(post), [onClick, post]);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
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
        <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
      </CardContent>
      <CardFooter className="mt-auto p-4 pt-0 text-left">
        <p className="text-xs text-muted-foreground">{formatDate(post.date)}</p>
      </CardFooter>
    </Card>
  );
});

export default function Blog() {
  const posts = getAllBlogPosts();
  const navigate = useNavigate();

  const handleOpen = useCallback(
    (post: BlogPost) => navigate(`/blog/${post.id}`),
    [navigate],
  );

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
              <BlogCard key={post.id} post={post} onClick={handleOpen} />
            ))}
          </div>
        )}
    </div>
  );
}
