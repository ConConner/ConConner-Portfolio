import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminShell, FormStatus } from "@/admin/AdminShell";
import { useDbRefresh } from "@/admin/useDbRefresh";
import { uploadImage } from "@/admin/storage";
import { getBlogPostById } from "@/data/db";
import { Markdown } from "@/components/Markdown";
import { supabase } from "@/lib/supabase";

interface FormState {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  body: string;
}

const emptyForm: FormState = {
  id: "",
  title: "",
  date: "",
  excerpt: "",
  coverImage: "",
  body: "",
};

export default function AdminBlogForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const refresh = useDbRefresh();
  const existing = id ? getBlogPostById(id) : undefined;
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState<FormState>(() =>
    existing
      ? {
          id: existing.id,
          title: existing.title,
          date: existing.date,
          excerpt: existing.excerpt,
          coverImage: existing.coverImage ?? "",
          body: existing.body,
        }
      : emptyForm,
  );
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (id && !existing) {
    return (
      <AdminShell title="Edit post">
        <p className="text-muted-foreground">No blog post with id "{id}".</p>
      </AdminShell>
    );
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(`Converting and uploading ${file.name}...`);
    try {
      update("coverImage", await uploadImage(`blog-${form.id || "posts"}`, file));
    } catch (uploadError) {
      setError(String(uploadError));
    }
    setBusy(null);
  };

  const handleBodyImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(`Converting and uploading ${file.name}...`);
    try {
      const url = await uploadImage(`blog-${form.id || "posts"}`, file);
      const snippet = `![](${url})`;
      const textarea = bodyRef.current;
      const cursor = textarea?.selectionStart ?? form.body.length;
      const before = form.body.slice(0, cursor);
      const after = form.body.slice(cursor);
      update("body", `${before}\n\n${snippet}\n\n${after}`);
    } catch (uploadError) {
      setError(String(uploadError));
    }
    setBusy(null);
  };

  const handleSave = async () => {
    if (!form.id.trim() || !form.title.trim() || !form.date) {
      setError("An id, title and date are required.");
      return;
    }

    setError(null);
    setBusy("Saving...");
    const { error: saveError } = await supabase.from("blog_posts").upsert({
      id: form.id.trim(),
      title: form.title,
      excerpt: form.excerpt,
      body: form.body,
      cover_image: form.coverImage || null,
      date: form.date,
      updated_at: new Date().toISOString(),
    });
    if (saveError) {
      setError(saveError.message);
      setBusy(null);
      return;
    }
    await refresh();
    navigate("/admin/blog");
  };

  return (
    <AdminShell title={existing ? `Edit ${existing.title}` : "New post"}>
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="id">Id</Label>
            <Input
              id="id"
              value={form.id}
              disabled={Boolean(existing)}
              placeholder="learning-rust"
              onChange={(event) => update("id", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="excerpt">Excerpt (shown in cards and the timeline)</Label>
          <Textarea
            id="excerpt"
            rows={2}
            value={form.excerpt}
            onChange={(event) => update("excerpt", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label>Cover image (optional, converted to WebP)</Label>
          {form.coverImage && (
            <div className="flex items-center gap-2">
              <img src={form.coverImage} alt="" className="h-12 w-20 object-cover" />
              <Button size="xs" variant="destructive" onClick={() => update("coverImage", "")}>
                Remove
              </Button>
            </div>
          )}
          <Input type="file" accept="image/*" onChange={handleCoverUpload} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="body">Body (Markdown)</Label>
            <Button size="xs" variant="outline" onClick={() => setPreview((p) => !p)}>
              {preview ? "Edit" : "Preview"}
            </Button>
          </div>

          {preview
            ? (
              <div className="min-h-40 border border-border p-3">
                <Markdown>{form.body || "Nothing to preview yet."}</Markdown>
              </div>
            )
            : (
              <Textarea
                id="body"
                ref={bodyRef}
                rows={16}
                className="font-mono text-sm"
                value={form.body}
                onChange={(event) => update("body", event.target.value)}
              />
            )}

          <div className="flex items-center gap-2">
            <Label htmlFor="body-image" className="text-xs text-muted-foreground">
              Insert image at cursor
            </Label>
            <Input
              id="body-image"
              type="file"
              accept="image/*"
              className="max-w-xs"
              onChange={handleBodyImageUpload}
            />
          </div>
        </div>

        <FormStatus error={error} busy={busy} />

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={Boolean(busy)}>
            Save
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/blog")}>
            Cancel
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}
