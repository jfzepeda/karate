import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth-context";
import { AreaProvider } from "@/lib/area-context";
import { NetworkProvider } from "@/lib/network-context";
import { OverlayProvider } from "@/lib/overlay-context";
import { TopTabs } from "@/components/top-tabs";
import { JuryModal } from "@/components/jury-modal";
import { BodyClassSync } from "@/components/body-class-sync";
import { SuperadminOverlay } from "@/components/superadmin-overlay";
import { ConnectionRequestModal } from "@/components/connection-request-modal";

export const metadata: Metadata = {
  title: "Karate Tournament Scoring",
  description: "Admin / Private / Public live scoring for karate tournaments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NetworkProvider>
            <StoreProvider>
              <OverlayProvider>
                <AreaProvider>
                  <BodyClassSync />
                  <TopTabs />
                  {children}
                  <JuryModal />
                  <SuperadminOverlay />
                  <ConnectionRequestModal />
                </AreaProvider>
              </OverlayProvider>
            </StoreProvider>
          </NetworkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
