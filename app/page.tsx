import Link from "next/link";
import { Nav } from "@/components/Nav";
import { MARKETS } from "@/lib/markets";

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

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <Nav />

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
        <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-[11px] font-medium text-lime-300">
          Live on Robinhood Chain Testnet
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
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
                <th className="px-4 py-3 text-right">Max lev.</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {MARKETS.map((m) => (
                <tr key={m.key} className="border-t border-white/5">
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
                  <td className="px-4 py-3 text-right text-lime-300">20x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-white/10 bg-[#101418] p-5"
          >
            <h3 className="text-sm font-semibold text-lime-300">{f.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              {f.body}
            </p>
          </div>
        ))}
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-[11px] text-neutral-600">
        Quiver — testnet demo. Not affiliated with Robinhood Markets, Inc.
        Nothing here is financial advice.
      </footer>
    </div>
  );
}
