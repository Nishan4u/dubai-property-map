export default function AdminIpBlockedPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <div className="rounded-2xl border border-rose-700/40 bg-navy-850 p-8">
        <h1 className="text-lg font-semibold text-rose-400">Access restricted</h1>
        <p className="mt-2 text-sm text-ink-400">
          The admin panel isn&apos;t accessible from your current network. Contact your platform
          administrator if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}
