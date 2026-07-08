import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Roadmap — Quiver",
  description:
    "Quiver roadmap: from testnet demo to on-chain tokenized-stock perps on Robinhood Chain.",
};

const PHASES = [
  {
    tag: "Phase 0",
    title: "Testnet demo",
    status: "live" as const,
    items: [
      "Trade terminal with vAMM-simulated markets (AAPL, TSLA, NVDA, MSFT, AMZN, HOOD)",
      "Market & limit orders, TP/SL triggers, partial close",
      "Order book, recent trades, 24h stats & funding display",
      "Wallet connect on Robinhood Chain Testnet (46630)",
    ],
  },
  {
    tag: "Phase 1",
    title: "Contracts on testnet",
    status: "next" as const,
    items: [
      "Deploy vAMM perp contracts to Robinhood Chain testnet",
      "tUSDC collateral vault, isolated margin & insurance fund per market",
      "Index-price keeper for tokenized-stock feeds",
      "On-chain open / close / liquidate flow from the terminal",
    ],
  },
  {
    tag: "Phase 2",
    title: "Hardening",
    status: "planned" as const,
    items: [
      "Liquidation keeper bots & funding settlement",
      "Guarded launch caps (per-wallet deposit, open interest)",
      "Audit & public testnet competition",
    ],
  },
  {
    tag: "Phase 3",
    title: "Mainnet & $QVR token launch",
    status: "planned" as const,
    items: [
      "Launch on Robinhood Chain mainnet alongside tokenized-stock availability",
      "Token generation event: $QVR with fixed 1B supply",
      "Airdrop to early testnet traders via points program",
      "Staking, fee discounts & governance go live",
      "More markets, cross-margin research, mobile-first terminal",
    ],
  },
];

const BADGE: Record<string, string> = {
  live: "border-lime-400/40 bg-lime-400/10 text-lime-300",
  next: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  planned: "border-white/15 bg-white/5 text-neutral-400",
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl">Roadmap</h1>
        <p className="mt-2 text-xs uppercase tracking-wider text-neutral-500">
          From demo to on-chain tokenized-stock perps
        </p>

        <div className="mt-10 space-y-6">
          {PHASES.map((p) => (
            <div
              key={p.tag}
              className="rounded-xl border border-white/10 bg-[#110e08] p-5"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                  {p.tag}
                </span>
                <h2 className="text-base font-bold text-white">{p.title}</h2>
                <span
                  className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${BADGE[p.status]}`}
                >
                  {p.status}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-neutral-400">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className="text-lime-300">·</span>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap gap-5 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.15em] text-neutral-500">
          <Link href="/trade" className="hover:text-lime-300">
            Open the app
          </Link>
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
