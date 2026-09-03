import { Navigate, useParams } from "react-router-dom";
import { Markdown } from "@/components/Markdown";
import { getBlogPostById } from "@/data/db";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const post = id ? getBlogPostById(id) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {post.title}
        </h1>
        <p className="text-sm text-muted-foreground">{formatDate(post.date)}</p>
      </div>

      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="aspect-video w-full rounded object-cover"
        />
      )}

      <Markdown>{post.body}</Markdown>
    </div>
  );
}
