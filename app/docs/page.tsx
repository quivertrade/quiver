import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MARKETS } from "@/lib/markets";

export const metadata: Metadata = {
  title: "Docs — Quiver",
  description:
    "How Quiver works: vAMM pricing, tokenized stock perps, leverage & isolated margin, liquidation, funding, and using the trade terminal on Robinhood Chain testnet.",
};

const CHAIN = {
  name: "Robinhood Chain Testnet",
  chainId: 46630,
  rpc: "https://rpc.testnet.chain.robinhood.com",
  explorer: "https://explorer.testnet.chain.robinhood.com",
};

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-neutral-500">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="font-mono text-lime-300 hover:underline">
          {value}
        </a>
      ) : (
        <code className="font-mono text-neutral-200">{value}</code>
      )}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-lg font-bold text-white">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-neutral-400">{children}</p>;
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p className="mt-2 text-xs uppercase tracking-wider text-neutral-500">
          Quiver · perpetual futures on tokenized stocks
        </p>

        <P>
          Quiver is a vAMM perpetual-futures protocol for{" "}
          <strong className="text-neutral-200">tokenized stocks</strong> on
          Robinhood Chain, an Arbitrum Orbit L2 built for real-world assets.
          Long or short equities like AAPL, TSLA and NVDA with up to 20x
          leverage — 24/7, no market hours. This page explains how the protocol
          works and how to use the app at{" "}
          <Link href="/trade" className="text-lime-300 hover:underline">
            /trade
          </Link>
          .
        </P>
        <P>
          <strong className="text-neutral-200">Status:</strong> demo on{" "}
          {CHAIN.name}. Trading is currently a client-side simulation — smart
          contracts are being ported and are not yet deployed. Nothing here has
          monetary value. See the{" "}
          <Link href="/risk" className="text-lime-300 hover:underline">
            risk disclaimer
          </Link>
          .
        </P>

        <H2>1. vAMM price discovery</H2>
        <P>
          Each market runs a <strong className="text-neutral-200">virtual AMM</strong>{" "}
          with constant-product pricing (<code className="font-mono">x·y=k</code>).
          The vAMM holds no real assets — it is purely a pricing curve. Trades
          move the mark price along the curve, and PnL is settled in tUSDC:
        </P>
        <P>
          <code className="font-mono text-neutral-200">
            pnl = size × (exit − entry) / entry
          </code>
        </P>

        <H2>2. Index price &amp; funding</H2>
        <P>
          An external <strong className="text-neutral-200">index price</strong>{" "}
          for each underlying stock anchors the vAMM. A periodic{" "}
          <strong className="text-neutral-200">funding rate</strong> (shown per
          8h in the terminal) pushes the mark back toward the index: longs pay
          shorts when the mark trades above the index, and vice versa.
        </P>

        <H2>3. Leverage &amp; isolated margin</H2>
        <P>
          Collateral (tUSDC) is posted per position with{" "}
          <strong className="text-neutral-200">isolated margin</strong> — risk
          in one market never touches another. Notional exposure is{" "}
          <code className="font-mono">margin × leverage</code>, up to{" "}
          <strong className="text-neutral-200">20x</strong>. Opening a position
          charges a 0.05% fee on notional.
        </P>

        <H2>4. Liquidation &amp; insurance fund</H2>
        <P>
          A position is liquidated when its equity falls below the maintenance
          threshold; the estimated liquidation price is always shown in the
          order panel and positions table. Each market keeps its own{" "}
          <strong className="text-neutral-200">insurance fund</strong> to absorb
          bad debt, keeping risk isolated per market.
        </P>

        <H2>5. Order types</H2>
        <P>
          The terminal supports <strong className="text-neutral-200">market</strong>{" "}
          and <strong className="text-neutral-200">limit</strong> orders, plus
          optional <strong className="text-neutral-200">take-profit</strong> and{" "}
          <strong className="text-neutral-200">stop-loss</strong> triggers that
          close the position automatically when the mark crosses your level.
          Positions can also be partially closed (50%).
        </P>

        <H2>6. Using the app</H2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-400">
          <li>
            Open{" "}
            <Link href="/trade" className="text-lime-300 hover:underline">
              /trade
            </Link>{" "}
            — demo mode works instantly with a $10,000 tUSDC paper balance.
          </li>
          <li>
            Optionally connect a wallet on {CHAIN.name} (chain ID{" "}
            {CHAIN.chainId}) for the upcoming on-chain flow.
          </li>
          <li>
            Pick a market, choose <strong className="text-neutral-200">Long</strong>{" "}
            or <strong className="text-neutral-200">Short</strong>, set margin
            and leverage, optionally add TP/SL, and open the position.
          </li>
          <li>
            Track PnL, the order book and recent trades in the tabs below the
            chart. Close 50% or 100% any time.
          </li>
        </ol>

        <H2>7. Network</H2>
        <div className="mt-3 rounded-xl border border-white/10 bg-[#101418] p-4 text-[13px]">
          <Row label="Network" value={CHAIN.name} />
          <Row label="Chain ID" value={`${CHAIN.chainId}`} />
          <Row label="RPC" value={CHAIN.rpc} />
          <Row label="Explorer" value={CHAIN.explorer} href={CHAIN.explorer} />
          <Row label="Markets" value={MARKETS.map((m) => m.label).join(", ")} />
        </div>

        <H2>8. FAQ</H2>
        <h3 className="mt-4 text-sm font-semibold text-neutral-200">Is this real money?</h3>
        <P>
          No. Quiver is a testnet demo — balances, positions and PnL are
          simulated and have no monetary value.
        </P>
        <h3 className="mt-4 text-sm font-semibold text-neutral-200">
          Are these real stocks?
        </h3>
        <P>
          No. Markets are perpetual futures on tokenized-stock index prices.
          You never hold the underlying equity, and there are no shareholder
          rights or dividends.
        </P>
        <h3 className="mt-4 text-sm font-semibold text-neutral-200">
          When do contracts go live?
        </h3>
        <P>
          The protocol contracts are being ported to Robinhood Chain testnet —
          see the{" "}
          <Link href="/roadmap" className="text-lime-300 hover:underline">
            roadmap
          </Link>{" "}
          for the current status.
        </P>

        <div className="mt-16 flex flex-wrap gap-5 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.15em] text-neutral-500">
          <Link href="/trade" className="hover:text-lime-300">
            Open the app
          </Link>
          <Link href="/roadmap" className="hover:text-lime-300">
            Roadmap
          </Link>
          <Link href="/risk" className="hover:text-lime-300">
            Risk
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
