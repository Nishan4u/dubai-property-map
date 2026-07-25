"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "./SignOutButton";
import type { UserRole } from "@/types/database";

export function AuthStatus() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        setName(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      setRole(profile?.role ?? null);
      setName(profile?.full_name ?? user.email ?? null);
      setLoading(false);
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => loadProfile());

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-navy-800" />;
  }

  if (!role) {
    return (
      <>
        <Link
          href="/login"
          className="rounded-lg border border-navy-700 px-2.5 py-2 text-xs font-medium text-ink-300 hover:text-ink-100 sm:px-3 sm:text-sm"
        >
          <span className="sm:hidden">Login</span>
          <span className="hidden sm:inline">Login / Register</span>
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-gold-500 px-2.5 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 sm:px-3 sm:text-sm"
        >
          <span className="sm:hidden">List</span>
          <span className="hidden sm:inline">List Your Property</span>
        </Link>
      </>
    );
  }

  const dashboardHref =
    role === "admin" ? "/admin" : role === "developer" ? "/dashboard" : "/account";

  return (
    <>
      <Link
        href={dashboardHref}
        className="hidden truncate text-sm font-medium text-ink-300 hover:text-ink-100 sm:block max-w-32"
      >
        {name}
      </Link>
      <Link
        href={dashboardHref}
        className="rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
      >
        {role === "admin" ? "Admin Panel" : role === "developer" ? "Dashboard" : "My Account"}
      </Link>
      <SignOutButton className="rounded-lg border border-navy-700 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100" />
    </>
  );
}
