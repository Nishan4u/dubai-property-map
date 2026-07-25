import { ContentEditor } from "@/components/admin/ContentEditor";
import { BlogPostManager } from "@/components/admin/BlogPostManager";
import { createClient } from "@/lib/supabase/server";
import { getAllBlogPostsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const supabase = await createClient();
  const [{ data: pages }, posts] = await Promise.all([
    supabase.from("site_content").select("slug, title, body").order("slug"),
    getAllBlogPostsAdmin(),
  ]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Content Management</h1>
        <p className="text-sm text-ink-400">
          Edit public page content — changes go live immediately.
        </p>
      </div>
      <ContentEditor pages={pages ?? []} />

      <div className="border-t border-navy-800 pt-8">
        <BlogPostManager posts={posts} />
      </div>
    </div>
  );
}
