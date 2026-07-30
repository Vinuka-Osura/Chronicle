import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { appearanceScript } from "@/lib/appearance";
import { lensScript } from "@/app/timeline/lenses";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/*
 * DEMO IDENTITY. Sam Iversen is the fictional engineer the seed data describes, so the
 * running application is coherent end to end before real content exists. Change these
 * three strings and the About page when the site becomes someone's for real.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sam Iversen - Software Engineer",
    template: "%s - Sam Iversen",
  },
  description:
    "Backend-leaning software engineer working on payments systems and reliability. Case studies, a career timeline, and the engineering behind this site.",
  openGraph: {
    type: "website",
    siteName: "Sam Iversen",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // Tells the browser both themes exist, so native UI - address bar, form controls,
  // scrollbars - matches whichever one is active.
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f16" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Blocking on purpose, and tiny. It stamps data-theme and data-recruiter on
          <html> before first paint so neither preference flashes the wrong appearance.
          suppressHydrationWarning above is because this script mutates the very element
          React is about to hydrate - intended, not a bug.
        */}
        <script dangerouslySetInnerHTML={{ __html: appearanceScript + lensScript }} />
      </head>
      {/*
        No appearance provider: the <html> data attributes are the source of truth and
        useAppearance subscribes to them directly, so there is no state to hoist.
      */}
      <body className="flex min-h-full flex-col antialiased">
        <SiteHeader />
        <main
          id="main"
          className="mx-auto w-full max-w-6xl grow px-4 py-10 sm:px-5 sm:py-12"
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
