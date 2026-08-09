import { PublicShell } from "@/components/public/PublicShell";
import { CompareClient } from "@/components/public/CompareClient";
import { ProjectAccessGate } from "@/components/public/ProjectAccessGate";
import { getMapAccessStatus, getPublishedProjects } from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";
import { buildOpenGraph } from "@/lib/seo";

export const dynamic = "force-dynamic";

const title = "Compare Dubai Off-Plan Projects Side by Side | Dubai Property Map";
const description =
  "Compare Dubai off-plan projects side by side — price, bedrooms, developer, and community — to shortlist the right one.";

export const metadata = {
  title,
  description,
  alternates: { canonical: "/compare" },
  // Previously unset entirely (no openGraph key), so a shared /compare
  // link's preview fell back to the root layout's generic homepage
  // title/description instead of this page's own -- correct
  // siteName/locale/image, wrong title/description.
  openGraph: buildOpenGraph({ title, description, url: "/compare" }),
};

export default async function ComparePage() {
  // Found during the Revision 2 §14 QA pass: this page had no access check
  // at all, unlike every other project-listing surface (Home, Communities,
  // All Projects, Developer pages) -- closing that gap here.
  const { status: mapAccessStatus, subscriptionHref } = await getMapAccessStatus();
  const rows = mapAccessStatus === "ok" ? await getPublishedProjects() : [];
  const projects = rows.map((r) => mapProject(r));

  return (
    <PublicShell>
      <ProjectAccessGate status={mapAccessStatus} subscriptionHref={subscriptionHref} contentLabel="project comparisons">
        <CompareClient projects={projects} />
      </ProjectAccessGate>
    </PublicShell>
  );
}
