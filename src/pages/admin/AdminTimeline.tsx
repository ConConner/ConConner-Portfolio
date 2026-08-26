import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminShell, FormStatus } from "@/admin/AdminShell";
import { useDbRefresh } from "@/admin/useDbRefresh";
import { uploadImage } from "@/admin/storage";
import { getTimelineEntries } from "@/data/db";
import type { TimelineEntry } from "@/data/types";
import { supabase } from "@/lib/supabase";

const emptyEntry: TimelineEntry = {
  id: "",
  date: "",
  name: "",
  description: "",
};

export default function AdminTimeline() {
  const refresh = useDbRefresh();
  const [draft, setDraft] = useState<TimelineEntry>(emptyEntry);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const entries = getTimelineEntries();

  const startEdit = (entry: TimelineEntry) => {
    setEditingId(entry.id);
    setDraft(entry);
    setError(null);
  };

  const reset = () => {
    setEditingId(null);
    setDraft(emptyEntry);
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(`Converting and uploading ${file.name}...`);
    try {
      const url = await uploadImage(`timeline-${draft.id || "posts"}`, file);
      setDraft((current) => ({ ...current, image: url }));
    } catch (uploadError) {
      setError(String(uploadError));
    }
    setBusy(null);
  };

  const handleSave = async () => {
    if (!draft.id.trim() || !draft.date || !draft.name.trim()) {
      setError("Id, date and name are required.");
      return;
    }

    setError(null);
    setBusy("Saving...");
    const { error: saveError } = await supabase.from("timeline_entries").upsert({
      id: draft.id.trim(),
      date: draft.date,
      name: draft.name,
      description: draft.description,
      image: draft.image || null,
    });
    if (saveError) setError(saveError.message);
    else {
      await refresh();
      reset();
    }
    setBusy(null);
  };

  const handleDelete = async (entry: TimelineEntry) => {
    if (!window.confirm(`Delete "${entry.name}"?`)) return;
    setError(null);
    setBusy(`Deleting ${entry.name}...`);
    const { error: deleteError } = await supabase
      .from("timeline_entries")
      .delete()
      .eq("id", entry.id);
    if (deleteError) setError(deleteError.message);
    else {
      await refresh();
      if (editingId === entry.id) reset();
    }
    setBusy(null);
  };

  return (
    <AdminShell title="Timeline">
      <div className="flex max-w-2xl flex-col gap-4">
        <h2 className="text-lg font-medium">
          {editingId ? `Edit ${editingId}` : "New entry"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="entry-id">Id</Label>
            <Input
              id="entry-id"
              value={draft.id}
              disabled={Boolean(editingId)}
              placeholder="learning-rust"
              onChange={(event) =>
                setDraft({ ...draft, id: event.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="entry-date">Date</Label>
            <Input
              id="entry-date"
              type="date"
              value={draft.date}
              onChange={(event) =>
                setDraft({ ...draft, date: event.target.value })
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="entry-name">Name</Label>
          <Input
            id="entry-name"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="entry-description">Description</Label>
          <Textarea
            id="entry-description"
            rows={5}
            value={draft.description}
            onChange={(event) =>
              setDraft({ ...draft, description: event.target.value })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Image (optional, converted to WebP)</Label>
          {draft.image && (
            <div className="flex items-center gap-2">
              <img src={draft.image} alt="" className="h-12 w-20 object-cover" />
              <Button
                size="xs"
                variant="destructive"
                onClick={() => setDraft({ ...draft, image: undefined })}
              >
                Remove
              </Button>
            </div>
          )}
          <Input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>

        <FormStatus error={error} busy={busy} />

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={Boolean(busy)}>
            {editingId ? "Save" : "Add entry"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="flex min-w-0 flex-col">
              <span className="font-medium">{entry.name}</span>
              <span className="text-xs text-muted-foreground">
                {entry.date} · {entry.id}
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(entry)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(entry)}
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
