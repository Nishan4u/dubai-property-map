"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/public/SiteHeader";
import { FilterSidebar } from "@/components/public/FilterSidebar";
import { ProjectListPanel } from "@/components/public/ProjectListPanel";
import { DubaiMap } from "@/components/public/DubaiMap";
import { MapFilterChips } from "@/components/public/MapFilterChips";
import { MapAmenityBar } from "@/components/public/MapAmenityBar";
import { FeaturedProjectCard } from "@/components/public/FeaturedProjectCard";
import { communities, projects as allProjects } from "@/data/mock";
import type { ListingType, ProjectTag } from "@/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ListingType>("buy");
  const [activeTag, setActiveTag] = useState<ProjectTag | "all">("all");
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    null
  );

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      const matchesTab = activeTab === "buy" ? true : p.listingType === activeTab;
      const matchesTag = activeTag === "all" || p.tags.includes(activeTag);
      return matchesTab && matchesTag;
    });
  }, [activeTab, activeTag]);

  const featuredProject =
    filteredProjects.find((p) => p.featured) ?? filteredProjects[0];

  return (
    <div className="flex h-screen flex-col bg-navy-950">
      <SiteHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeFilterCount={3}
      />
      <div className="flex min-h-0 flex-1">
        <FilterSidebar />
        <ProjectListPanel projects={filteredProjects} />
        <div className="relative flex-1">
          <div className="absolute left-4 right-[21rem] top-4 z-10">
            <MapFilterChips active={activeTag} onChange={setActiveTag} />
          </div>
          <DubaiMap
            communities={communities}
            projects={filteredProjects}
            selectedCommunityId={selectedCommunityId}
            onSelectCommunity={setSelectedCommunityId}
          />
          {featuredProject && (
            <FeaturedProjectCard key={featuredProject.id} project={featuredProject} />
          )}
          <div className="absolute inset-x-4 bottom-4 z-10">
            <MapAmenityBar />
          </div>
        </div>
      </div>
    </div>
  );
}
