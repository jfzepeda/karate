import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth-context";
import { AreaProvider } from "@/lib/area-context";
import { TopTabs } from "@/components/top-tabs";
import { JuryModal } from "@/components/jury-modal";
import { BodyClassSync } from "@/components/body-class-sync";

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
          <StoreProvider>
            <AreaProvider>
              <BodyClassSync />
              <TopTabs />
              {children}
              <JuryModal />
            </AreaProvider>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
