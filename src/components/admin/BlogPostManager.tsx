"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { UploadProgressItem } from "@/components/ui/UploadProgress";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  published: boolean;
  cover_image_url: string | null;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BlogPostManager({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  // Non-null while editing an existing post rather than creating a new
  // one -- same form, same fields, just an update instead of an insert
  // on submit, and the slug (the public URL, already shared/indexed)
  // stays fixed rather than being editable.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setExcerpt("");
    setBody("");
    setCoverImageUrl("");
    setUploadingFile(null);
    setUploadError("");
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setTitle(post.title);
    setExcerpt(post.excerpt ?? "");
    setBody(post.body);
    setCoverImageUrl(post.cover_image_url ?? "");
    setShowForm(true);
  }

  function toggleForm() {
    if (showForm) {
      resetForm();
    }
    setShowForm((s) => !s);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingFile(file);
    setUploadPercent(0);
    setUploadError("");

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `blog-images/${Date.now()}-${safeName}`;
    const { promise } = uploadFileWithProgress("project-media", path, file, setUploadPercent);
    const { error } = await promise;
    if (error) {
      setUploadError(error.message);
      setUploadingFile(null);
      return;
    }
    const { data } = supabase.storage.from("project-media").getPublicUrl(path);
    setCoverImageUrl(data.publicUrl);
    setUploadingFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    if (editingId) {
      // Slug intentionally excluded -- it's the post's public URL,
      // already shared/indexed, and shouldn't shift on a content edit.
      await supabase
        .from("blog_posts")
        .update({ title, excerpt, body, cover_image_url: coverImageUrl || null })
        .eq("id", editingId);
    } else {
      await supabase.from("blog_posts").insert({
        slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        excerpt,
        body,
        cover_image_url: coverImageUrl || null,
        published: false,
      });
    }
    resetForm();
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function togglePublished(id: string, published: boolean) {
    const supabase = createClient();
    await supabase.from("blog_posts").update({ published: !published }).eq("id", id);
    router.refresh();
  }

  async function deletePost(id: string) {
    const supabase = createClient();
    await supabase.from("blog_posts").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-100">Blog Posts</h2>
        <button
          onClick={toggleForm}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          {showForm ? "Cancel" : "New Post"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-xl border border-navy-700 bg-navy-850 p-4"
        >
          {editingId && <p className="text-xs font-medium text-gold-400">Editing existing post — slug and publish status are unchanged.</p>}
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short excerpt"
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          <textarea
            required
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Full article body"
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          {uploadingFile && (
            <UploadProgressItem
              fileName={uploadingFile.name}
              fileSize={uploadingFile.size}
              state={uploadError ? "error" : uploadPercent >= 100 ? "processing" : "uploading"}
              percent={uploadPercent}
              errorMessage={uploadError}
              onRemove={uploadError ? () => setUploadingFile(null) : undefined}
            />
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy-600 bg-navy-900">
              <ProjectThumb
                gradient="from-amber-500/40 via-slate-800 to-slate-950"
                imageUrl={coverImageUrl || null}
                className="h-full w-full"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 px-4 py-2.5 text-sm text-ink-300 hover:border-gold-500/40 hover:text-ink-100">
              <Upload className="h-4 w-4" />
              {uploadingFile ? "Uploading…" : coverImageUrl ? "Replace Cover Image" : "Upload Cover Image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={!!uploadingFile}
                onChange={handleImageUpload}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {loading ? "Saving…" : editingId ? "Save Changes" : "Save as Draft"}
          </button>
        </form>
      )}

      <DataTable
        columns={[
          {
            header: "",
            render: (p) => (
              <div className="h-10 w-16 overflow-hidden rounded-md border border-navy-700 bg-navy-900">
                <ProjectThumb
                  gradient="from-amber-500/40 via-slate-800 to-slate-950"
                  imageUrl={p.cover_image_url}
                  className="h-full w-full"
                />
              </div>
            ),
          },
          { header: "Title", render: (p) => <span className="font-medium text-ink-100">{p.title}</span> },
          {
            header: "Status",
            render: (p) => (
              <Badge tone={p.published ? "green" : "neutral"}>
                {p.published ? "Published" : "Draft"}
              </Badge>
            ),
          },
          {
            header: "",
            render: (p) => (
              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(p)}
                  className="text-xs font-medium text-ink-300 hover:text-ink-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => togglePublished(p.id, p.published)}
                  className="text-xs font-medium text-gold-400 hover:text-gold-300"
                >
                  {p.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => deletePost(p.id)}
                  className="text-xs font-medium text-rose-400 hover:text-rose-300"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={posts}
      />
    </div>
  );
}
