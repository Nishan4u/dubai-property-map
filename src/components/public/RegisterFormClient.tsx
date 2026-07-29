"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { CompactSelect } from "@/components/public/CompactSelect";

interface DeveloperOption {
  id: string;
  name: string;
  approved_email_domain: string | null;
}

export function RegisterFormClient({ disabledTypes = [] }: { disabledTypes?: string[] }) {
  const allTypes = ["buyer", "developer", "broker", "broker_agency", "salesperson"] as const;
  const enabledTypes = allTypes.filter((t) => !disabledTypes.includes(t));
  const [role, setRole] = useState<"buyer" | "developer" | "broker" | "broker_agency" | "salesperson">(
    enabledTypes[0] ?? "buyer"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [jobTitle, setJobTitle] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [developers, setDevelopers] = useState<DeveloperOption[]>([]);
  const [developerId, setDeveloperId] = useState("");

  const [agencyPhone, setAgencyPhone] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [officeDetails, setOfficeDetails] = useState("");

  useEffect(() => {
    if (role !== "salesperson" || developers.length > 0) return;
    const supabase = createClient();
    supabase
      .from("developers")
      .select("id, name, approved_email_domain")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => setDevelopers(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const selectedDeveloper = developers.find((d) => d.id === developerId) ?? null;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (role === "salesperson") {
      if (!selectedDeveloper) {
        setStatus("error");
        setErrorMsg("Please select the developer you work for.");
        return;
      }
      if (!selectedDeveloper.approved_email_domain) {
        setStatus("error");
        setErrorMsg(
          `${selectedDeveloper.name} hasn't configured salesperson email verification yet. Ask them to add you directly instead.`
        );
        return;
      }
      const domain = selectedDeveloper.approved_email_domain.replace(/^@/, "").toLowerCase();
      const emailDomain = email.split("@")[1]?.toLowerCase();
      if (emailDomain !== domain) {
        setStatus("error");
        setErrorMsg(
          `Please use your official company email address to register as a salesperson for ${selectedDeveloper.name} (must end in @${domain}).`
        );
        return;
      }
    }

    setStatus("loading");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        password,
        role,
        ...(role === "salesperson" ? { developerId, jobTitle, mobile, whatsapp } : {}),
        ...(role === "broker_agency" ? { agencyPhone, contactPerson, officeDetails } : {}),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error ?? "Something went wrong — please try again.");
      return;
    }

    setStatus("sent");
    // Server-side backstop is also 60s -- keep the button's own cooldown in
    // sync so it isn't inviting an immediate click that's guaranteed to be
    // silently swallowed.
    setResendCooldown(60);
  }

  async function handleResend() {
    setResendStatus("loading");
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendStatus(res.ok ? "sent" : "error");
    setResendCooldown(60);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-navy-700 bg-navy-850 p-8">
        <h1 className="text-xl font-bold text-ink-100">Create an account</h1>
        <p className="mt-1 text-sm text-ink-400">
          Save favorites, get price alerts, and book viewings faster.
        </p>

        {enabledTypes.length === 0 ? (
          <p className="mt-6 text-sm text-ink-400">
            Registration is temporarily closed. Please check back later.
          </p>
        ) : status === "sent" ? (
          <div className="mt-6 rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <p>
              Check <span className="font-medium">{email}</span> for a
              confirmation link to activate your account.
            </p>
            <div className="mt-3 border-t border-emerald-600/30 pt-3">
              {resendStatus === "sent" ? (
                <p className="text-xs font-medium text-emerald-300">
                  Confirmation email resent{resendCooldown > 0 ? ` — you can resend again in ${resendCooldown}s` : ""}.
                </p>
              ) : (
                <>
                  <p className="text-xs text-emerald-300/80">
                    Didn&apos;t get it? It can take a minute, and some mail apps
                    (like Gmail&apos;s mobile app) may open the link automatically —
                    if that happens, just log in directly instead of resending.
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendStatus === "loading" || resendCooldown > 0}
                    className="mt-2 text-xs font-semibold text-gold-400 hover:underline disabled:opacity-60"
                  >
                    {resendStatus === "loading"
                      ? "Resending…"
                      : resendCooldown > 0
                        ? `Resend available in ${resendCooldown}s`
                        : "Resend confirmation email"}
                  </button>
                </>
              )}
              {resendStatus === "error" && (
                <p className="mt-1 text-xs font-medium text-rose-400">
                  Couldn&apos;t resend — please try again shortly.
                </p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {enabledTypes.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={clsx(
                    "rounded-lg py-2 text-sm font-medium capitalize",
                    role === r
                      ? "bg-gold-500 text-navy-950"
                      : "border border-navy-600 text-ink-300"
                  )}
                >
                  {r === "buyer"
                    ? "Buyer / Investor"
                    : r === "developer"
                      ? "Developer"
                      : r === "broker"
                        ? "Broker"
                        : r === "broker_agency"
                          ? "Broker Agency"
                          : "Salesperson"}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                {role === "broker_agency" ? "Agency Name" : "Full Name"}
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={role === "broker_agency" ? "e.g. ABC Real Estate" : "Your name"}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>

            {role === "broker_agency" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-400">Contact Person</label>
                  <input
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Name of the person we should contact"
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-400">Phone</label>
                  <input
                    required
                    value={agencyPhone}
                    onChange={(e) => setAgencyPhone(e.target.value)}
                    placeholder="+971…"
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-400">Office Details</label>
                  <input
                    required
                    value={officeDetails}
                    onChange={(e) => setOfficeDetails(e.target.value)}
                    placeholder="Office address"
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-ink-500">
                  You&apos;ll upload your agency license after your email is verified and you log in.
                </p>
              </>
            )}

            {role === "salesperson" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-400">Job Title</label>
                    <input
                      required
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Sales Executive"
                      className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-400">Mobile Number</label>
                    <input
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+971…"
                      className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-400">WhatsApp Number</label>
                  <input
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+971…"
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <CompactSelect
                    label="Select Developer"
                    placeholder="Select the developer you work for…"
                    value={developerId}
                    onChange={setDeveloperId}
                    options={developers.map((d) => ({ label: d.name, value: d.id }))}
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                {role === "salesperson" ? "Official Developer Email" : role === "broker_agency" ? "Company Email" : "Email"}
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === "salesperson" ? "you@developer.com" : "you@example.com"}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
              {role === "salesperson" && selectedDeveloper?.approved_email_domain && (
                <p className="mt-1 text-[11px] text-ink-500">
                  Must end in @{selectedDeveloper.approved_email_domain.replace(/^@/, "")}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                Password
              </label>
              <PasswordInput
                required
                minLength={6}
                value={password}
                onChange={setPassword}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>

            {status === "error" && (
              <p className="text-xs font-medium text-rose-400">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {status === "loading" ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="text-gold-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
