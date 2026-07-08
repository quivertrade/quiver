import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Risk Disclaimer — Quiver",
  description: "Risk disclaimer for the Quiver testnet demo.",
};

export default function RiskPage() {
  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">Risk Disclaimer</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-400">
          <p>
            Quiver is an experimental <strong className="text-neutral-200">testnet demo</strong>.
            All balances, positions, prices and PnL shown in the app are
            simulated and have <strong className="text-neutral-200">no monetary value</strong>.
            No smart contracts are currently deployed; nothing you do in the
            app creates a real financial position.
          </p>
          <p>
            Perpetual futures are high-risk leveraged derivatives. When the
            protocol goes live on-chain, positions can be{" "}
            <strong className="text-neutral-200">liquidated</strong> and
            collateral can be lost entirely. Leverage amplifies both gains and
            losses. The software will initially be{" "}
            <strong className="text-neutral-200">unaudited</strong>.
          </p>
          <p>
            Markets on Quiver are synthetic perpetuals referencing
            tokenized-stock index prices. They are{" "}
            <strong className="text-neutral-200">not equity securities</strong> —
            you receive no ownership, voting rights or dividends in the
            underlying companies.
          </p>
          <p>
            Quiver is not affiliated with, endorsed by, or sponsored by
            Robinhood Markets, Inc. Nothing on this site is financial, legal or
            tax advice. Use at your own risk.
          </p>
        </div>
        <div className="mt-16 flex flex-wrap gap-5 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.15em] text-neutral-500">
          <Link href="/docs" className="hover:text-lime-300">
            Docs
          </Link>
          <Link href="/" className="hover:text-lime-300">
            ← Back home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
