import { Suspense } from "react";
import { PublicShell } from "@/components/public/PublicShell";
import { LoginFormClient } from "@/components/public/LoginFormClient";

export default function LoginPage() {
  return (
    <PublicShell>
      <Suspense fallback={null}>
        <LoginFormClient />
      </Suspense>
    </PublicShell>
  );
}
