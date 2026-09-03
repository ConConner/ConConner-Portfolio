import { useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminShell, FormStatus } from "@/admin/AdminShell";
import { useDbRefresh } from "@/admin/useDbRefresh";
import { uploadImage, uploadPatch } from "@/admin/storage";
import { getAllContent, getAllGames, getContentById } from "@/data/db";
import type { Download } from "@/data/types";
import { supabase } from "@/lib/supabase";

interface FormState {
  id: string;
  type: "hack" | "tool" | "project";
  gameIds: string[];
  name: string;
  authors: string;
  description: string;
  date: string;
  position: number;
  images: string[];
  downloads: Download[];
}

const emptyForm = (position: number): FormState => ({
  id: "",
  type: "hack",
  gameIds: [],
  name: "",
  authors: "",
  description: "",
  date: "",
  position,
  images: [],
  downloads: [],
});

export default function AdminContentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const refresh = useDbRefresh();
  const games = getAllGames();
  const existing = id ? getContentById(id) : undefined;

  const [form, setForm] = useState<FormState>(() =>
    existing
      ? {
          id: existing.id,
          type:
            existing.type === "tool"
              ? "tool"
              : existing.type === "project"
                ? "project"
                : "hack",
          gameIds: existing.game ? existing.game.split(/\s+/).filter(Boolean) : [],
          name: existing.name,
          authors: existing.authors.join(", "),
          description: existing.description,
          date: existing.date ?? "",
          position: getAllContent().findIndex((item) => item.id === existing.id),
          images: existing.images,
          downloads: existing.downloads,
        }
      : emptyForm(getAllContent().length),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (id && !existing) {
    return (
      <AdminShell title="Edit content">
        <p className="text-muted-foreground">No content item with id "{id}".</p>
      </AdminShell>
    );
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleGame = (gameId: string) =>
    setForm((current) => ({
      ...current,
      gameIds: current.gameIds.includes(gameId)
        ? current.gameIds.filter((value) => value !== gameId)
        : [...current.gameIds, gameId],
    }));

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setBusy(`Converting and uploading ${files.length} image(s)...`);
    try {
      const urls = await Promise.all(
        files.map((file) => uploadImage(form.id || "misc", file)),
      );
      setForm((current) => ({ ...current, images: [...current.images, ...urls] }));
    } catch (uploadError) {
      setError(String(uploadError));
    }
    setBusy(null);
  };

  const moveImage = (index: number, offset: number) =>
    setForm((current) => {
      const images = [...current.images];
      const target = index + offset;
      if (target < 0 || target >= images.length) return current;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...current, images };
    });

  const updateDownload = (index: number, patch: Partial<Download>) =>
    setForm((current) => ({
      ...current,
      downloads: current.downloads.map((download, position) =>
        position === index ? { ...download, ...patch } : download,
      ),
    }));

  const handlePatchUpload = async (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(`Uploading ${file.name}...`);
    try {
      updateDownload(index, { path: await uploadPatch(file) });
    } catch (uploadError) {
      setError(String(uploadError));
    }
    setBusy(null);
  };

  const handleSave = async () => {
    if (!form.id.trim() || !form.name.trim()) {
      setError("An id and a name are required.");
      return;
    }

    setError(null);
    setBusy("Saving...");
    try {
      const { error: itemError } = await supabase.from("content_items").upsert({
        id: form.id.trim(),
        type: form.type,
        game_ids: form.gameIds,
        name: form.name,
        authors: form.authors
          .split(",")
          .map((author) => author.trim())
          .filter(Boolean),
        description: form.description,
        date: form.date || null,
        position: form.position,
        updated_at: new Date().toISOString(),
      });
      if (itemError) throw new Error(itemError.message);

      // Images and downloads have generated ids, so there is nothing to
      // upsert on: replace both lists wholesale.
      for (const table of ["content_images", "content_downloads"]) {
        const { error: clearError } = await supabase
          .from(table)
          .delete()
          .eq("content_id", form.id.trim());
        if (clearError) throw new Error(clearError.message);
      }

      if (form.images.length > 0) {
        const { error: imageError } = await supabase.from("content_images").insert(
          form.images.map((url, position) => ({
            content_id: form.id.trim(),
            url,
            position,
          })),
        );
        if (imageError) throw new Error(imageError.message);
      }

      const downloads = form.downloads.filter((download) => download.path.trim());
      if (downloads.length > 0) {
        const { error: downloadError } = await supabase
          .from("content_downloads")
          .insert(
            downloads.map((download) => ({
              content_id: form.id.trim(),
              name: download.name,
              path: download.path.trim(),
              date: download.date ?? "",
            })),
          );
        if (downloadError) throw new Error(downloadError.message);
      }

      await refresh();
      navigate("/admin");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
      setBusy(null);
    }
  };

  return (
    <AdminShell title={existing ? `Edit ${existing.name}` : "New content"}>
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="id">Id</Label>
            <Input
              id="id"
              value={form.id}
              disabled={Boolean(existing)}
              placeholder="my-new-hack"
              onChange={(event) => update("id", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                update("type", value as "hack" | "tool" | "project")
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hack">Hack</SelectItem>
                <SelectItem value="tool">Tool</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Games</Label>
          <div className="flex flex-wrap gap-3">
            {Object.entries(games).map(([gameId, game]) => (
              <label key={gameId} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.gameIds.includes(gameId)}
                  onChange={() => toggleGame(gameId)}
                />
                {game.name}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="authors">Authors (comma separated)</Label>
            <Input
              id="authors"
              value={form.authors}
              onChange={(event) => update("authors", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date (optional)</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="position">Sort position (lower comes first)</Label>
          <Input
            id="position"
            type="number"
            value={form.position}
            onChange={(event) => update("position", Number(event.target.value))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={8}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label>Images (converted to WebP on upload)</Label>
          {form.images.map((url, index) => (
            <div key={url} className="flex items-center gap-2">
              <img src={url} alt="" className="h-12 w-20 object-cover" />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {url}
              </span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => moveImage(index, -1)}
              >
                Up
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => moveImage(index, 1)}
              >
                Down
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  update(
                    "images",
                    form.images.filter((_, position) => position !== index),
                  )
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Input type="file" accept="image/*" multiple onChange={handleImageUpload} />
        </div>

        <div className="flex flex-col gap-3">
          <Label>Downloads</Label>
          {form.downloads.map((download, index) => (
            <div key={index} className="flex flex-col gap-2 border border-border p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Name"
                  value={download.name}
                  onChange={(event) =>
                    updateDownload(index, { name: event.target.value })
                  }
                />
                <Input
                  placeholder="Date (2024-07-16, 2018-12, or empty)"
                  value={download.date}
                  onChange={(event) =>
                    updateDownload(index, { date: event.target.value })
                  }
                />
              </div>
              <Input
                placeholder="Storage URL, or an external release link"
                value={download.path}
                onChange={(event) =>
                  updateDownload(index, { path: event.target.value })
                }
              />
              <div className="flex items-center justify-between gap-2">
                <Input
                  type="file"
                  className="max-w-xs"
                  onChange={(event) => handlePatchUpload(index, event)}
                />
                <Button
                  size="xs"
                  variant="destructive"
                  onClick={() =>
                    update(
                      "downloads",
                      form.downloads.filter((_, position) => position !== index),
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              update("downloads", [
                ...form.downloads,
                { name: "", path: "", date: "" },
              ])
            }
          >
            Add download
          </Button>
        </div>

        <FormStatus error={error} busy={busy} />

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={Boolean(busy)}>
            Save
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Cancel
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}
