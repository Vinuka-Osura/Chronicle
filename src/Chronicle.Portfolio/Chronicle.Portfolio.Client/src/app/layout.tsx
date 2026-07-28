import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { RecruiterModeProvider, recruiterModeScript } from "@/lib/recruiter-mode";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vinuka Osura - Software Engineer",
    template: "%s - Vinuka Osura",
  },
  description:
    "Backend-leaning software engineer working on banking systems and reliability. Case studies, a career timeline, and the engineering behind this site.",
  openGraph: {
    type: "website",
    siteName: "Vinuka Osura",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
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
          Blocking on purpose, and tiny. It stamps data-recruiter on <html> before the
          first paint so Recruiter Mode never flashes the wrong layout.
          suppressHydrationWarning above is because this script mutates the very element
          React is about to hydrate - intended behaviour, not a bug.
        */}
        <script dangerouslySetInnerHTML={{ __html: recruiterModeScript }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <RecruiterModeProvider>
          <NavBar />
          <main id="main" className="mx-auto w-full max-w-6xl grow px-5 py-12">
            {children}
          </main>
          <Footer />
        </RecruiterModeProvider>
      </body>
    </html>
  );
}
