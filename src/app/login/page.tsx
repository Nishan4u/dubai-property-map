import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";

export default function LoginPage() {
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-navy-700 bg-navy-850 p-8">
          <h1 className="text-xl font-bold text-ink-100">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-400">
            Log in to manage favorites, saved searches and viewing requests.
          </p>
          <form className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400"
            >
              Login
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-ink-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-gold-400 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
