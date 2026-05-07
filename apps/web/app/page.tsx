"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status.kind === "loading") return;
    if (status.kind === "anonymous" || status.kind === "locked") return; // AuthGate handles
    if (!user) return;
    if (user.role === "superadmin") router.replace("/superadmin");
    else router.replace("/area-select");
  }, [router, status, user]);

  return (
    <div className="auth-screen">
      <div className="auth-card auth-loading">Loading…</div>
    </div>
  );
}
