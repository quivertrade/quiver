import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MARKETS, dayStats, fmtCompact } from "@/lib/markets";

const HERO_STATS = [
  { label: "Markets", value: `${MARKETS.length}` },
  { label: "Max leverage", value: "20x" },
  {
    label: "24h volume (demo)",
    value: `$${fmtCompact(MARKETS.reduce((s, m) => s + dayStats(m, m.basePrice).volume, 0))}`,
  },
  { label: "Network", value: "Robinhood Chain" },
];

const FEATURES = [
  {
    n: "01",
    title: "Tokenized stock perps",
    body: "Long or short AAPL, TSLA, NVDA and more with up to 20x leverage — 24/7, no market hours.",
  },
  {
    n: "02",
    title: "vAMM price discovery",
    body: "Virtual AMM (x·y=k) marks every trade on-chain. PnL settles against an external index price.",
  },
  {
    n: "03",
    title: "Isolated margin",
    body: "Risk is contained per market. A per-market insurance fund backstops bad debt.",
  },
  {
    n: "04",
    title: "Built on Robinhood Chain",
    body: "An Arbitrum Orbit L2 purpose-built for tokenized real-world assets. Testnet chain ID 46630.",
  },
];

const STEPS = [
  {
    title: "Connect",
    body: "Any EVM wallet on Robinhood Chain Testnet (chain ID 46630).",
  },
  {
    title: "Pick a market",
    body: "Six tokenized-stock perps with live demo index feeds.",
  },
  {
    title: "Trade",
    body: "Set margin and leverage, go long or short — market or limit, with TP/SL.",
  },
];

const FAQ = [
  {
    q: "Is this real money?",
    a: "No — Quiver is a testnet demo. Balances, positions and PnL are simulated and have no monetary value.",
  },
  {
    q: "Are these real stocks?",
    a: "No. Markets are perpetual futures on tokenized-stock index prices — you never hold the underlying equity.",
  },
  {
    q: "When do contracts go live?",
    a: "The vAMM perp contracts are being ported to Robinhood Chain testnet. See the roadmap for status.",
  },
  {
    q: "What wallet do I need?",
    a: "Any EVM wallet (e.g. MetaMask) configured for Robinhood Chain Testnet, chain ID 46630.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Nav />

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-lime-400/10 blur-[120px]"
        />
        <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-24 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3.5 py-1.5 text-[11px] font-medium text-lime-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime-300" />
            </span>
            Live on Robinhood Chain Testnet
          </span>
          <h1 className="font-display mx-auto mt-7 max-w-3xl text-5xl leading-[1.05] sm:text-7xl">
            Perpetual futures on{" "}
            <span className="text-lime-300 italic">tokenized stocks</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">
            Trade equities like crypto — leveraged, permissionless, and always
            open. Quiver is a vAMM perpetuals exchange on Robinhood Chain, the
            L2 built for real-world assets.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/trade"
              className="rounded-full bg-lime-400 px-7 py-3 text-sm font-bold text-black shadow-[0_0_30px_rgba(204,255,0,0.25)] transition hover:shadow-[0_0_45px_rgba(204,255,0,0.4)]"
            >
              Launch Trade Terminal
            </Link>
            <Link
              href="/docs"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-neutral-300 transition hover:border-white/30 hover:bg-white/5"
            >
              Read the Docs
            </Link>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="bg-[#0a0a06] px-4 py-6">
                <div className="font-mono text-xl font-bold text-lime-300">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-4">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl">Markets</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Demo index feeds · up to 20x leverage
            </p>
          </div>
          <Link
            href="/trade"
            className="text-xs font-medium text-lime-300 hover:underline"
          >
            Open terminal →
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a06]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-5 py-3.5">Market</th>
                <th className="hidden px-5 py-3.5 sm:table-cell">Underlying</th>
                <th className="px-5 py-3.5 text-right">Index (demo)</th>
                <th className="px-5 py-3.5 text-right">24h</th>
                <th className="hidden px-5 py-3.5 text-right sm:table-cell">
                  Max lev.
                </th>
                <th className="px-5 py-3.5 text-right" />
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {MARKETS.map((m) => {
                const chg = dayStats(m, m.basePrice).changePct;
                return (
                  <tr
                    key={m.key}
                    className="border-t border-white/5 transition hover:bg-white/5"
                  >
                    <td className="px-5 py-4">
                      <span
                        className="mr-2.5 inline-block h-2 w-2 rounded-full"
                        style={{ background: m.color }}
                      />
                      <span className="font-semibold text-white">
                        {m.label}
                      </span>
                    </td>
                    <td className="hidden px-5 py-4 text-neutral-400 sm:table-cell">
                      {m.name}
                    </td>
                    <td className="px-5 py-4 text-right text-neutral-200">
                      ${m.basePrice.toFixed(2)}
                    </td>
                    <td
                      className={`px-5 py-4 text-right ${chg >= 0 ? "text-lime-300" : "text-red-400"}`}
                    >
                      {chg >= 0 ? "+" : ""}
                      {chg.toFixed(2)}%
                    </td>
                    <td className="hidden px-5 py-4 text-right text-neutral-400 sm:table-cell">
                      20x
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href="/trade"
                        className="rounded-full bg-lime-400/10 px-3.5 py-1.5 text-[11px] font-semibold text-lime-300 transition hover:bg-lime-400/20"
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="font-display text-2xl sm:text-3xl">Why Quiver</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/10 bg-[#0a0a06] p-6 transition hover:border-lime-400/30"
            >
              <div className="font-mono text-[11px] text-neutral-600 group-hover:text-lime-300/60">
                {f.n}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-lime-300">
                {f.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="font-display text-2xl sm:text-3xl">How it works</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="rounded-2xl border border-white/10 bg-[#0a0a06] p-6"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-400/10 font-mono text-xs font-bold text-lime-300">
                {i + 1}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20">
        <h2 className="font-display text-center text-2xl sm:text-3xl">FAQ</h2>
        <div className="mt-7 space-y-3">
          {FAQ.map((f) => (
            <div
              key={f.q}
              className="rounded-2xl border border-white/10 bg-[#0a0a06] p-5"
            >
              <h3 className="text-sm font-semibold text-white">{f.q}</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                {f.a}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center text-xs text-neutral-500">
          More detail in the{" "}
          <Link href="/docs" className="text-lime-300 hover:underline">
            documentation
          </Link>
          .
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-lime-400/20 bg-[#0a0a06] px-6 py-14 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[220px] w-[520px] -translate-x-1/2 rounded-full bg-lime-400/10 blur-[100px]"
          />
          <h2 className="font-display relative text-3xl sm:text-4xl">
            Ready to trade stocks{" "}
            <span className="text-lime-300 italic">24/7</span>?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-neutral-400">
            Jump into the testnet demo — no sign-up, no real funds, just
            connect and trade.
          </p>
          <Link
            href="/trade"
            className="relative mt-7 inline-block rounded-full bg-lime-400 px-7 py-3 text-sm font-bold text-black shadow-[0_0_30px_rgba(204,255,0,0.25)] transition hover:shadow-[0_0_45px_rgba(204,255,0,0.4)]"
          >
            Launch Trade Terminal
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
