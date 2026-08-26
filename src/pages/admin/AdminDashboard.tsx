import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminShell, FormStatus } from "@/admin/AdminShell";
import { useDbRefresh } from "@/admin/useDbRefresh";
import { getAllContent } from "@/data/db";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const refresh = useDbRefresh();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const content = getAllContent();

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setError(null);
    setBusy(`Deleting ${name}...`);
    // Images and downloads go with it via `on delete cascade`. The uploaded
    // files stay in Storage — cheap, and it keeps old links alive.
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    if (error) setError(error.message);
    else await refresh();
    setBusy(null);
  };

  return (
    <AdminShell
      title="Content"
      action={
        <Button asChild size="sm">
          <Link to="/admin/content/new">New item</Link>
        </Button>
      }
    >
      <FormStatus error={error} busy={busy} />

      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {content.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{item.name}</span>
                <Badge variant="outline">{item.type}</Badge>
                {item.game && <Badge variant="secondary">{item.game}</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">
                {item.id} · {item.images.length} images ·{" "}
                {item.downloads.length} downloads
              </span>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to={`/admin/content/${item.id}/edit`}>Edit</Link>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(item.id, item.name)}
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
