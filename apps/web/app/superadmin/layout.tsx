import { AuthGate } from "@/components/auth-gate";

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate roles={["superadmin"]}>{children}</AuthGate>;
}
