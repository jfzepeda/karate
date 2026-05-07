import { AuthGate } from "@/components/auth-gate";

// The audience scoreboard requires no login: a tablet/projector can land here
// directly. It mirrors live state from authed admin/private windows via
// BroadcastChannel and never modifies the source of truth.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate allowAnonymous>{children}</AuthGate>;
}
