import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AdminShell, FormStatus } from "@/admin/AdminShell";
import { useDbRefresh } from "@/admin/useDbRefresh";
import { getAllBlogPosts } from "@/data/db";
import { supabase } from "@/lib/supabase";

export default function AdminBlogList() {
  const refresh = useDbRefresh();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const posts = getAllBlogPosts();

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setError(null);
    setBusy(`Deleting ${title}...`);
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) setError(error.message);
    else await refresh();
    setBusy(null);
  };

  return (
    <AdminShell
      title="Blog"
      action={
        <Button asChild size="sm">
          <Link to="/admin/blog/new">New post</Link>
        </Button>
      }
    >
      <FormStatus error={error} busy={busy} />

      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {posts.map((post) => (
          <li
            key={post.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-medium">{post.title}</span>
              <span className="text-xs text-muted-foreground">
                {post.date} · {post.id}
              </span>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to={`/admin/blog/${post.id}/edit`}>Edit</Link>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(post.id, post.title)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
