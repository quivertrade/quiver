import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Portfolio } from "@/components/Portfolio";

export const metadata: Metadata = {
  title: "Portfolio — Quiver",
  description:
    "Your Quiver testnet portfolio: equity, realized PnL curve, win rate and closed trades.",
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl sm:text-4xl">Portfolio</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Testnet demo account performance — realized PnL, win rate and trade
          history.
        </p>
        <div className="mt-8">
          <Portfolio />
        </div>
      </main>
      <Footer />
    </div>
  );
}
