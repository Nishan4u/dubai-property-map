export default function DeveloperProfilePage() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-ink-100">Company Profile</h1>
      <div className="max-w-2xl space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company Name" defaultValue="DAMAC Properties" />
          <Field label="Contact Email" defaultValue="sales@damacproperties.com" />
          <Field label="Phone" defaultValue="+971 4 123 4567" />
          <Field label="Website" defaultValue="https://damacproperties.com" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">
            About
          </label>
          <textarea
            rows={4}
            defaultValue="Luxury developer known for branded residences and golf-front communities across Dubai."
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          />
        </div>
        <button className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">
        {label}
      </label>
      <input
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
      />
    </div>
  );
}
