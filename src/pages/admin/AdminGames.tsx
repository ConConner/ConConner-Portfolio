import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminShell, FormStatus } from "@/admin/AdminShell";
import { useDbRefresh } from "@/admin/useDbRefresh";
import { getAllGames } from "@/data/db";
import { supabase } from "@/lib/supabase";

interface GameDraft {
  id: string;
  name: string;
  console: string;
  sha1: string;
  crc32: string;
}

const emptyDraft: GameDraft = {
  id: "",
  name: "",
  console: "",
  sha1: "",
  crc32: "",
};

export default function AdminGames() {
  const refresh = useDbRefresh();
  const [draft, setDraft] = useState<GameDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const games = getAllGames();

  const reset = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const handleSave = async () => {
    if (!draft.id.trim() || !draft.name.trim()) {
      setError("An id and a name are required.");
      return;
    }

    setError(null);
    setBusy("Saving...");
    const { error: saveError } = await supabase.from("games").upsert({
      id: draft.id.trim(),
      name: draft.name,
      console: draft.console,
      sha1: draft.sha1,
      crc32: draft.crc32,
    });
    if (saveError) setError(saveError.message);
    else {
      await refresh();
      reset();
    }
    setBusy(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setError(null);
    setBusy(`Deleting ${name}...`);
    const { error: deleteError } = await supabase
      .from("games")
      .delete()
      .eq("id", id);
    if (deleteError) setError(deleteError.message);
    else {
      await refresh();
      if (editingId === id) reset();
    }
    setBusy(null);
  };

  return (
    <AdminShell title="Games">
      <div className="flex max-w-2xl flex-col gap-4">
        <h2 className="text-lg font-medium">
          {editingId ? `Edit ${editingId}` : "New game"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="game-id">Id</Label>
            <Input
              id="game-id"
              value={draft.id}
              disabled={Boolean(editingId)}
              placeholder="zm"
              onChange={(event) => setDraft({ ...draft, id: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="game-name">Name</Label>
            <Input
              id="game-name"
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="game-console">Console</Label>
            <Input
              id="game-console"
              value={draft.console}
              placeholder="GBA"
              onChange={(event) =>
                setDraft({ ...draft, console: event.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="game-crc32">CRC32</Label>
            <Input
              id="game-crc32"
              value={draft.crc32}
              placeholder="5C61A844"
              onChange={(event) =>
                setDraft({ ...draft, crc32: event.target.value })
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="game-sha1">SHA-1</Label>
          <Input
            id="game-sha1"
            value={draft.sha1}
            onChange={(event) => setDraft({ ...draft, sha1: event.target.value })}
          />
        </div>

        <FormStatus error={error} busy={busy} />

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={Boolean(busy)}>
            {editingId ? "Save" : "Add game"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {Object.entries(games).map(([id, game]) => (
          <li
            key={id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="flex min-w-0 flex-col">
              <span className="font-medium">
                {game.name} ({game.console})
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {id} · CRC32 {game.CRC32}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(id);
                  setDraft({
                    id,
                    name: game.name,
                    console: game.console,
                    sha1: game["SHA-1"],
                    crc32: game.CRC32,
                  });
                  setError(null);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(id, game.name)}
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
