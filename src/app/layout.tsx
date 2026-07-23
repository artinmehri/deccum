import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Deccum — Retirement withdrawal planning for US & Canada",
    template: "%s · Deccum",
  },
  description:
    "No signup required. Know which account to withdraw from next — 401(k), IRA, RRSP, TFSA, and more — in plain English.",
  applicationName: "Deccum",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  keywords: [
    "retirement planning",
    "withdrawal sequence",
    "401k",
    "RRSP",
    "TFSA",
    "Social Security",
    "CPP",
    "OAS",
  ],
  openGraph: {
    title: "Deccum — Know which account to use next",
    description:
      "Free retirement withdrawal guidance for the United States and Canada. No account required.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Deccum" }],
  },
  twitter: {
    card: "summary",
    title: "Deccum — Know which account to use next",
    description:
      "Free retirement withdrawal guidance for the United States and Canada.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col text-ink"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
