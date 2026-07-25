"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { createClient } from "@/lib/supabase/client";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
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
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `blog-images/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("project-media").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("project-media").getPublicUrl(path);
      setCoverImageUrl(data.publicUrl);
    }
    e.target.value = "";
    setUploading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.from("blog_posts").insert({
      slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      excerpt,
      body,
      cover_image_url: coverImageUrl || null,
      published: false,
    });
    setTitle("");
    setExcerpt("");
    setBody("");
    setCoverImageUrl("");
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
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          New Post
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-xl border border-navy-700 bg-navy-850 p-4"
        >
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
              {uploading ? "Uploading…" : coverImageUrl ? "Replace Cover Image" : "Upload Cover Image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={handleImageUpload}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save as Draft"}
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
