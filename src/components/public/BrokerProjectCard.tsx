"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAed } from "@/data/mock";
import { BrokerProjectEnquiryForm } from "@/components/public/BrokerProjectEnquiryForm";
import type { ProjectPreview } from "@/lib/supabase/queries";

// Deliberately shows BOTH the Developer (logo/name, real project ownership)
// and the Broker (photo/name/agency, who represents it) side by side, per
// spec section 5 -- never implies the broker owns the project.
export function BrokerProjectCard({
  brokerId,
  project,
  brokerName,
  brokerPhotoUrl,
  brokerageName,
}: {
  brokerId: string;
  project: ProjectPreview;
  brokerName: string;
  brokerPhotoUrl?: string | null;
  brokerageName?: string | null;
}) {
  const [showEnquiry, setShowEnquiry] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-navy-700 bg-navy-850">
      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-navy-800 to-navy-900">
        {project.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.cover_image_url} alt={project.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-ink-500">{project.property_type}</span>
        )}
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold text-ink-100">{project.name}</p>
        <p className="text-xs text-ink-500">by {project.developer_name}</p>
        <p className="mt-1 text-sm font-semibold text-gold-400">{formatAed(project.price_from_aed)}</p>

        <div className="mt-3 flex items-center gap-2 border-t border-navy-800 pt-3">
          {brokerPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brokerPhotoUrl} alt={brokerName} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-[10px] font-semibold text-navy-950">
              {brokerName.charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink-200">Represented by {brokerName}</p>
            {brokerageName && <p className="truncate text-[10px] text-ink-500">{brokerageName}</p>}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Link
            href={`/projects/${project.slug}`}
            className="flex-1 rounded-lg border border-navy-600 py-1.5 text-center text-xs font-medium text-ink-300 hover:text-ink-100"
          >
            View Project
          </Link>
          <button
            onClick={() => setShowEnquiry((v) => !v)}
            className="flex-1 rounded-lg bg-gold-500 py-1.5 text-center text-xs font-semibold text-navy-950 hover:bg-gold-400"
          >
            {showEnquiry ? "Close" : "Enquire"}
          </button>
        </div>
        {showEnquiry && (
          <div className="mt-3">
            <BrokerProjectEnquiryForm brokerId={brokerId} projectId={project.id} projectName={project.name} brokerName={brokerName} />
          </div>
        )}
      </div>
    </div>
  );
}
