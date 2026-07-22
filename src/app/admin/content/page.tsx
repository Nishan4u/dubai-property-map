import { FileText } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function AdminContentPage() {
  return (
    <PlaceholderPage
      icon={FileText}
      title="Content Management"
      description="Manage homepage sections, static pages, blog posts, menus and SEO metadata."
      bullets={[
        "Homepage, About, Contact, FAQ pages",
        "Blog posts & menus",
        "SEO: meta tags, schema, sitemap, redirects",
      ]}
    />
  );
}
