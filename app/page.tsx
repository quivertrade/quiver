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
    title: "Tokenized stock perps",
    body: "Long or short AAPL, TSLA, NVDA and more with up to 20x leverage — 24/7, no market hours.",
  },
  {
    title: "vAMM price discovery",
    body: "Virtual AMM (x·y=k) marks every trade on-chain. PnL settles against an external index price.",
  },
  {
    title: "Isolated margin",
    body: "Risk is contained per market. A per-market insurance fund backstops bad debt.",
  },
  {
    title: "Built on Robinhood Chain",
    body: "An Arbitrum Orbit L2 purpose-built for tokenized real-world assets. Testnet chain ID 46630.",
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

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
        <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-[11px] font-medium text-lime-300">
          Live on Robinhood Chain Testnet
        </span>
        <h1 className="font-display mx-auto mt-6 max-w-3xl text-5xl leading-tight sm:text-7xl">
          Perpetual futures on{" "}
          <span className="text-lime-300">tokenized stocks</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">
          Trade equities like crypto — leveraged, permissionless, and always
          open. Quiver is a vAMM perpetuals exchange on Robinhood Chain, the
          L2 built for real-world assets.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/trade"
            className="rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-black hover:opacity-90"
          >
            Launch Trade Terminal
          </Link>
          <a
            href="https://explorer.testnet.chain.robinhood.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-neutral-300 hover:bg-white/5"
          >
            Testnet Explorer
          </a>
          <Link
            href="/docs"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-neutral-300 hover:bg-white/5"
          >
            Read the Docs
          </Link>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:grid-cols-4">
          {HERO_STATS.map((s) => (
            <div key={s.label} className="bg-[#000000] px-4 py-5">
              <div className="font-mono text-lg font-bold text-white">
                {s.value}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Market</th>
                <th className="px-4 py-3">Underlying</th>
                <th className="px-4 py-3 text-right">Index (demo)</th>
                <th className="px-4 py-3 text-right">24h</th>
                <th className="px-4 py-3 text-right">Max lev.</th>
                <th className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {MARKETS.map((m) => {
                const chg = dayStats(m, m.basePrice).changePct;
                return (
                  <tr
                    key={m.key}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full"
                        style={{ background: m.color }}
                      />
                      <span className="text-white">{m.label}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{m.name}</td>
                    <td className="px-4 py-3 text-right text-neutral-200">
                      ${m.basePrice.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${chg >= 0 ? "text-lime-300" : "text-red-400"}`}
                    >
                      {chg >= 0 ? "+" : ""}
                      {chg.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right text-lime-300">20x</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href="/trade"
                        className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-neutral-300 hover:bg-white/10"
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

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-white/10 bg-[#110e08] p-5"
          >
            <h3 className="text-sm font-semibold text-lime-300">{f.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              {f.body}
            </p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-center text-2xl font-bold">FAQ</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <div
              key={f.q}
              className="rounded-lg border border-white/10 bg-[#110e08] p-5"
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

      <Footer />
    </div>
  );
}
