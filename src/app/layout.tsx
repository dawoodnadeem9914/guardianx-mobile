import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SettingsProvider } from "@/lib/settingsContext";

export const metadata: Metadata = {
  title: "GuardianX Mobile",
  description: "GuardianX Easy Emergency Assistant",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GuardianX",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

// viewportFit: "cover" is what actually lets the app draw edge-to-edge
// on notched/Dynamic-Island iPhones instead of Safari auto-letterboxing
// content away from the notch — required for the safe-area-inset CSS
// in globals.css to have anything real to react to.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1220",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-navy font-sans antialiased">
        <SettingsProvider>
          <div className="safe-area-shell mx-auto flex min-h-screen w-full max-w-md flex-col">
            {children}
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}
