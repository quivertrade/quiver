import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quiver-trade.com"),
  title: "Quiver — Tokenized Stock Perps on Robinhood Chain",
  description:
    "Perpetual futures on tokenized stocks. Long or short AAPL, TSLA, NVDA and more with leverage — on Robinhood Chain testnet.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Quiver",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/brand/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
