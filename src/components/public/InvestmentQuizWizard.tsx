"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Download, TrendingUp } from "lucide-react";
import { CompactSelect } from "@/components/public/CompactSelect";
import { NearbyDistances } from "@/components/public/NearbyDistances";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import type { NearestPoi } from "@/lib/investmentScore";

const STEP_LABELS = ["Purpose", "Budget", "Location", "Timeline", "Contact"];

const PURPOSE_OPTIONS = [
  { value: "end_use", label: "🏠 End Use" },
  { value: "investment", label: "📈 Investment" },
  { value: "second_home", label: "🏖 Second Home" },
  { value: "golden_visa", label: "💼 Golden Visa" },
];

const BUDGET_OPTIONS = [
  { label: "Under AED 1M", min: 0, max: 1_000_000 },
  { label: "AED 1M – 2M", min: 1_000_000, max: 2_000_000 },
  { label: "AED 2M – 5M", min: 2_000_000, max: 5_000_000 },
  { label: "AED 5M+", min: 5_000_000, max: null as number | null },
];

const TIMELINE_OPTIONS = ["Immediately", "1–3 months", "3–6 months", "Just researching"];

interface CommunityReportData {
  kind: "community";
  community: { id: string; name: string; slug: string };
  projectCount: number;
  avgInvestmentScore: number | null;
  avgPriceAed: number;
  minPriceAed: number;
  maxPriceAed: number;
  marketInsights: {
    offPlanCount: number;
    readyCount: number;
    topDevelopersByCount: { name: string; count: number }[];
    topTags: { tag: string; count: number }[];
  };
  nearby: NearestPoi[];
  roi: { netAnnualIncome: number; cashOnCashRoi: number; grossRoi: number } | null;
  yield: { grossYield: number; netYield: number } | null;
  projects: { slug: string; name: string; priceFromAed: number; bedroomsFrom: number; bedroomsTo: number }[];
}

interface CitywideReportData {
  kind: "citywide";
  topCommunities: { id: string; name: string; slug: string; projectCount: number; avgPriceAed: number; avgInvestmentScore: number }[];
}

type ReportData = CommunityReportData | CitywideReportData;

export function InvestmentQuizWizard({
  communities,
  supportWhatsappNumber,
}: {
  communities: { id: string; name: string }[];
  supportWhatsappNumber: string;
}) {
  const [step, setStep] = useState(1);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [budgetIndex, setBudgetIndex] = useState<number | null>(null);
  const [communityId, setCommunityId] = useState("");
  const [timeline, setTimeline] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);

  const communityName = communities.find((c) => c.id === communityId)?.name ?? null;

  async function handleSubmit() {
    setLoading(true);
    setErrorMsg("");

    const budget = budgetIndex != null ? BUDGET_OPTIONS[budgetIndex] : null;
    const res = await fetch("/api/investment-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose,
        budgetMin: budget?.min ?? null,
        budgetMax: budget?.max ?? null,
        communityId: communityId || null,
        purchaseTimeline: timeline,
        fullName,
        email,
        whatsapp,
        sourcePath: typeof window !== "undefined" ? window.location.pathname : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const reportRes = await fetch(
      communityId ? `/api/investment-leads/report?communityId=${communityId}` : "/api/investment-leads/report"
    );
    const reportData = (await reportRes.json().catch(() => null)) as ReportData | null;
    setReport(reportData);
    setLoading(false);
  }

  if (report) {
    return <InvestmentReport report={report} communityNameFallback={communityName} supportWhatsappNumber={supportWhatsappNumber} />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
                step === i + 1
                  ? "bg-gold-500 text-navy-950"
                  : step > i + 1
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-navy-800 text-ink-500"
              }`}
            >
              {step > i + 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={step === i + 1 ? "font-medium text-ink-100" : "text-ink-500"}>{label}</span>
            {i < STEP_LABELS.length - 1 && <span className="mx-1 text-ink-700">—</span>}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-6">
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-ink-100">What are you looking for?</h2>
            <div className="grid grid-cols-2 gap-2">
              {PURPOSE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setPurpose(o.value)}
                  className={`rounded-lg py-3 text-sm font-medium ${
                    purpose === o.value ? "bg-gold-500 text-navy-950" : "border border-navy-600 text-ink-300 hover:text-ink-100"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-ink-100">What&apos;s your budget?</h2>
            <div className="grid grid-cols-2 gap-2">
              {BUDGET_OPTIONS.map((o, i) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setBudgetIndex(i)}
                  className={`rounded-lg py-3 text-sm font-medium ${
                    budgetIndex === i ? "bg-gold-500 text-navy-950" : "border border-navy-600 text-ink-300 hover:text-ink-100"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-ink-100">Preferred community?</h2>
            <CompactSelect
              label="Community"
              hideLabel
              placeholder="Not sure yet"
              value={communityId}
              onChange={setCommunityId}
              options={communities.map((c) => ({ label: c.name, value: c.id }))}
            />
            <p className="text-xs text-ink-500">
              Leave blank and we&apos;ll show you the most active communities across Dubai instead.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-ink-100">When are you looking to purchase?</h2>
            <div className="grid grid-cols-2 gap-2">
              {TIMELINE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeline(t)}
                  className={`rounded-lg py-3 text-sm font-medium ${
                    timeline === t ? "bg-gold-500 text-navy-950" : "border border-navy-600 text-ink-300 hover:text-ink-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-ink-100">Where should we send your report?</h2>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">WhatsApp (optional)</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+971…"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100 disabled:opacity-40"
        >
          Back
        </button>
        {step < 5 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={(step === 1 && !purpose) || (step === 2 && budgetIndex == null) || (step === 4 && !timeline)}
            className="rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !fullName.trim() || !email.trim()}
            className="rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {loading ? "Generating…" : "Get My Investment Report"}
          </button>
        )}
      </div>
    </div>
  );
}

function InvestmentReport({
  report,
  communityNameFallback,
  supportWhatsappNumber,
}: {
  report: ReportData;
  communityNameFallback: string | null;
  supportWhatsappNumber: string;
}) {
  const { formatPrice, formatMoney } = useLocale();
  const reportTitle =
    report.kind === "community" ? `${report.community.name} Investment Report` : "Dubai Investment Report";
  const whatsappMessage =
    report.kind === "community"
      ? `Hi, I just completed the Dubai Investment quiz for ${report.community.name}. I'd like to learn more.`
      : "Hi, I just completed the Dubai Investment quiz and I'd like to learn more.";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-2 text-gold-400">
          <TrendingUp className="h-5 w-5" />
          <h1 className="text-lg font-semibold text-ink-100">{reportTitle}</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100"
        >
          <Download className="h-3.5 w-3.5" /> Download PDF
        </button>
      </div>

      {report.kind === "community" ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-center">
              <p className="text-xs text-ink-500">Live Projects</p>
              <p className="mt-1 text-xl font-bold text-ink-100">{report.projectCount}</p>
            </div>
            <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-center">
              <p className="text-xs text-ink-500">Avg. Investment Score</p>
              <p className="mt-1 text-xl font-bold text-gold-400">{report.avgInvestmentScore ?? "—"}/100</p>
            </div>
            <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-center">
              <p className="text-xs text-ink-500">Avg. Starting Price</p>
              <p className="mt-1 text-xl font-bold text-ink-100">{formatPrice(report.avgPriceAed)}</p>
            </div>
          </div>

          {report.roi && report.yield && (
            <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink-100">ROI &amp; Yield Snapshot</h2>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-ink-500">Gross ROI</p>
                  <p className="font-semibold text-ink-100">{report.roi.grossRoi.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Cash-on-Cash ROI</p>
                  <p className="font-semibold text-gold-400">{report.roi.cashOnCashRoi.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Gross Rental Yield</p>
                  <p className="font-semibold text-ink-100">{report.yield.grossYield.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Net Rental Yield</p>
                  <p className="font-semibold text-ink-100">{report.yield.netYield.toFixed(2)}%</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-ink-500">
                Seeded from {report.community.name}&apos;s real average starting price — not a projection for any
                specific unit.
              </p>
            </div>
          )}

          {report.nearby.length > 0 && (
            <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink-100">Location Intelligence</h2>
              <NearbyDistances items={report.nearby} />
            </div>
          )}

          {report.projects.length > 0 && (
            <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink-100">Featured Projects in {report.community.name}</h2>
              <div className="space-y-2">
                {report.projects.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/projects/${p.slug}`}
                    className="flex items-center justify-between rounded-lg border border-navy-700 px-3 py-2 text-sm hover:border-gold-500/40"
                  >
                    <span className="text-ink-200">{p.name}</span>
                    <span className="font-medium text-gold-400">{formatPrice(p.priceFromAed)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Dubai&apos;s Most Active Communities</h2>
          <div className="space-y-2">
            {report.topCommunities.map((c) => (
              <Link
                key={c.id}
                href={`/communities/${c.slug}`}
                className="flex items-center justify-between rounded-lg border border-navy-700 px-3 py-2.5 text-sm hover:border-gold-500/40"
              >
                <div>
                  <span className="text-ink-200">{c.name}</span>
                  <span className="ml-2 text-xs text-ink-500">{c.projectCount} projects</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gold-400">{formatMoney(c.avgPriceAed)}</p>
                  <p className="text-[11px] text-ink-500">Score {c.avgInvestmentScore}/100</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {supportWhatsappNumber && (
        <a
          href={getWhatsAppUrl(supportWhatsappNumber, whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="no-print flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Chat with Our Team on WhatsApp
        </a>
      )}
      <p className="text-center text-xs text-ink-500">
        {communityNameFallback && report.kind === "citywide"
          ? `We couldn't find ${communityNameFallback} in our records — showing Dubai's most active communities instead.`
          : "Based on real, live project data from Dubai Property Map."}
      </p>
    </div>
  );
}
