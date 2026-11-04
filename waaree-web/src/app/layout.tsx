import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

// Waaree's brand font (docs/design/design-rules.md §2)
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  // Absolute base for share images (Open Graph). Set NEXT_PUBLIC_SITE_URL per environment.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Waaree", template: "%s · Waaree" },
  description: "Waaree Energies",
  // Preview deployments (e.g. the proposal link) set NEXT_PUBLIC_NOINDEX=1 so search engines skip them.
  ...(process.env.NEXT_PUBLIC_NOINDEX === "1" && { robots: { index: false, follow: false } }),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: only for <html>'s own attributes, which browser extensions and the
    // dark-mode class may change before React loads. Children are still checked.
    <html lang="en" className={`${poppins.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
