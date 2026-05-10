import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Séance",
  description: "A creative diagnosis for visual creators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
