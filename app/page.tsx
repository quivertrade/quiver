import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { LandingNav } from "@/components/LandingNav";
import { MARKETS, dayStats, fmtCompact } from "@/lib/markets";

export const revalidate = 60;

interface LandingQuote {
  price: number;
  changePct: number;
}

async function fetchQuotes(): Promise<Partial<Record<string, LandingQuote>>> {
  const out: Partial<Record<string, LandingQuote>> = {};
  await Promise.all(
    MARKETS.map(async (m) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${m.key}?interval=1d&range=1d`,
          { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } },
        );
        if (!res.ok) return;
        const meta = (await res.json())?.chart?.result?.[0]?.meta;
        if (!meta?.regularMarketPrice) return;
        const prev = meta.previousClose ?? meta.chartPreviousClose;
        out[m.key] = {
          price: meta.regularMarketPrice,
          changePct: prev
            ? ((meta.regularMarketPrice - prev) / prev) * 100
            : 0,
        };
      } catch {
        // fall back to demo price
      }
    }),
  );
  return out;
}

const PROBLEMS = [
  {
    title: "Markets close at 4pm",
    body: "Stock exchanges shut down nights, weekends and holidays. News never does — price gaps happen while you can't act.",
  },
  {
    title: "No easy way to short",
    body: "Shorting equities means margin accounts, borrow fees and locate requirements. Most retail traders simply can't.",
  },
  {
    title: "Leverage is gated",
    body: "Meaningful leverage on stocks is reserved for institutions and prime brokers — not for the average trader.",
  },
  {
    title: "Settlement is slow",
    body: "Traditional equity trades settle T+1 through layers of intermediaries. Nothing about it is programmable.",
  },
];

const HOW = [
  {
    tag: "Connect",
    title: "Any EVM wallet",
    body: "Connect on Robinhood Chain Testnet (chain ID 46630) and mint free tUSDC collateral from the faucet.",
  },
  {
    tag: "Pick a market",
    title: "Six tokenized-stock perps",
    body: "AAPL, TSLA, NVDA, MSFT, AMZN and HOOD — anchored to real live index price feeds.",
  },
  {
    tag: "Trade",
    title: "Long or short, up to 20x",
    body: "Set margin and leverage, open on-chain against the vAMM. PnL settles in tUSDC when you close.",
  },
];

const FAQ = [
  {
    q: "Is this real money?",
    a: "No — Quiver runs on Robinhood Chain testnet. Collateral is test tUSDC from the faucet and has no monetary value.",
  },
  {
    q: "Are these real stocks?",
    a: "No. Markets are perpetual futures on tokenized-stock index prices — you never hold the underlying equity.",
  },
  {
    q: "Are the contracts live?",
    a: "Yes — the vAMM perp, tUSDC faucet and vault contracts are deployed on Robinhood Chain testnet. Connect a wallet on /trade to open positions on-chain. Addresses are in the docs.",
  },
  {
    q: "What wallet do I need?",
    a: "Any EVM wallet (e.g. MetaMask) configured for Robinhood Chain Testnet, chain ID 46630.",
  },
];

function Arrow() {
  return <span className="mr-3 text-black">→</span>;
}

export default async function Home() {
  const quotes = await fetchQuotes();
  const volume = `$${fmtCompact(MARKETS.reduce((s, m) => s + dayStats(m, m.basePrice).volume, 0))}`;
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Announcement bar */}
      <Link
        href="/trade"
        className="block bg-black py-2.5 text-center text-[13px] text-white transition hover:text-lime-300"
      >
        Perps on tokenized equities — live on Robinhood Chain Testnet. ⇢
      </Link>

      <LandingNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-4">
        <div className="px-6 pb-8 pt-16 sm:pt-24">
          <div className="text-center">
            <div className="text-sm">
              🏹 <strong>Robinhood</strong> Chain
            </div>
            <h1 className="font-display mx-auto mt-6 max-w-3xl text-5xl leading-[1.08] sm:text-6xl">
              Trade stocks like crypto,
              <br />
              24/7 and on-chain
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-neutral-700">
              Long or short tokenized equities with up to 20x leverage on a
              vAMM perpetuals exchange — no market hours, no broker, PnL
              settled on Robinhood Chain.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/trade"
                className="border border-black/15 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-black transition hover:border-black/40"
              >
                Launch Terminal
              </Link>
              <Link
                href="/docs"
                className="bg-black px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
              >
                ⇢ Read the Docs
              </Link>
            </div>
          </div>

          {/* Hero artwork */}
          <div className="mt-14">
            <Image
              src="/brand/hero-archers.jpg"
              alt="Archers in Sherwood forest — lime duotone artwork"
              width={1536}
              height={1024}
              priority
              className="h-[260px] w-full object-cover sm:h-[420px]"
            />
          </div>

          {/* Lime stats panel */}
          <div className="relative overflow-hidden bg-gradient-to-br from-lime-300 via-[#d8ff33] to-[#9fc700]">
            <div className="relative grid grid-cols-2 gap-px sm:grid-cols-4">
              {[
                { label: "Markets", value: `${MARKETS.length}` },
                { label: "Max leverage", value: "20x" },
                { label: "24h index volume", value: volume },
                { label: "Trading hours", value: "24/7" },
              ].map((s) => (
                <div key={s.label} className="px-6 py-10 text-center">
                  <div className="font-display text-3xl text-black sm:text-4xl">
                    {s.value}
                  </div>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-black/60">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative border-t border-black/15 px-6 py-3 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-black/50">
              ➳ Quiver — perpetual futures on tokenized stocks ➳
            </div>
          </div>
        </div>
      </section>

      {/* Problem — black section */}
      <section className="mt-6 bg-black text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display mx-auto max-w-3xl text-center text-3xl leading-snug sm:text-5xl">
            Stock markets close at 4pm, gate leverage, and make shorting{" "}
            <span className="text-neutral-500">nearly impossible.</span>
          </h2>
          <div className="mt-14 grid gap-px bg-white/10 sm:grid-cols-2">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="bg-black p-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-300/10 text-lg">
                  🏹
                </div>
                <h3 className="font-display mt-5 text-xl">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution — light section */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="px-6 py-16 sm:px-10">
          <h2 className="font-display mx-auto max-w-3xl text-center text-3xl leading-snug sm:text-4xl">
            Open a leveraged position on a tokenized stock in one transaction
          </h2>

          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-2xl">
                Long or short, up to 20x
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                Post tUSDC as isolated margin and trade against a virtual AMM
                (x·y=k). A keeper anchors every market to its real index
                price, and liquidations keep the system solvent.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start">
                  <Arrow />
                  One-click open, close and settle — fully on-chain
                </li>
                <li className="flex items-start">
                  <Arrow />
                  Isolated margin: one market never touches another
                </li>
                <li className="flex items-start">
                  <Arrow />
                  Real index feeds pushed on-chain by a keeper
                </li>
                <li className="flex items-start">
                  <Arrow />
                  0.10% taker fee, 5% maintenance margin
                </li>
              </ul>
            </div>

            {/* Markets table */}
            <div className="border border-black/10">
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Live markets
                </span>
                <Link
                  href="/trade"
                  className="text-[11px] font-bold uppercase tracking-wider text-black hover:underline"
                >
                  Open terminal →
                </Link>
              </div>
              <table className="w-full text-left text-sm">
                <tbody className="font-mono text-xs">
                  {MARKETS.map((m) => {
                    const lq = quotes[m.key];
                    const px = lq?.price ?? m.basePrice;
                    const chg =
                      lq?.changePct ?? dayStats(m, m.basePrice).changePct;
                    return (
                      <tr key={m.key} className="border-t border-black/5">
                        <td className="px-5 py-3.5">
                          <span
                            className="mr-2.5 inline-block h-2 w-2 rounded-full"
                            style={{ background: m.color }}
                          />
                          <span className="font-semibold">{m.label}</span>
                        </td>
                        <td className="px-3 py-3.5 text-right text-neutral-700">
                          ${px.toFixed(2)}
                        </td>
                        <td
                          className={`px-3 py-3.5 text-right ${chg >= 0 ? "text-lime-600" : "text-red-500"}`}
                        >
                          {chg >= 0 ? "+" : ""}
                          {chg.toFixed(2)}%
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/trade?m=${m.key}`}
                            className="bg-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-neutral-800"
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
          </div>
        </div>
      </section>

      {/* Full-bleed artwork */}
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="relative overflow-hidden">
          <Image
            src="/brand/quiver-3d.jpg"
            alt="Quiver with arrows on lime background"
            width={1536}
            height={1024}
            className="h-[280px] w-full object-cover sm:h-[460px]"
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/85 px-6 py-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-lime-300">
              ➳ Every market, one quiver
            </span>
            <Link
              href="/trade"
              className="hidden text-[11px] font-bold uppercase tracking-wider text-white hover:text-lime-300 sm:block"
            >
              Start trading →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — black section */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display max-w-2xl text-3xl leading-snug sm:text-4xl">
            How Quiver turns tUSDC into leveraged stock exposure
          </h2>
          <div className="mt-12 grid gap-px bg-white/10 md:grid-cols-3">
            {HOW.map((h) => (
              <div key={h.tag} className="bg-black p-8">
                <div className="inline-block border border-lime-300/30 bg-lime-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-lime-300">
                  {h.tag}
                </div>
                <h3 className="font-display mt-5 text-xl">{h.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                  {h.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-neutral-500">
            vAMM, faucet and vault contract addresses are published in the{" "}
            <Link href="/docs" className="text-lime-300 hover:underline">
              docs
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FAQ — light */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="px-6 py-16 sm:px-10">
          <h2 className="font-display text-3xl sm:text-4xl">
            Have questions? Find answers.
          </h2>
          <div className="mt-8 divide-y divide-black/10 border-y border-black/10">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
                  {f.q}
                  <span className="text-neutral-400 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — black band */}
      <section className="bg-black text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 py-16 sm:flex-row sm:items-center">
          <h2 className="font-display max-w-md text-3xl leading-snug sm:text-4xl">
            Ready to trade stocks 24/7?
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/trade"
              className="bg-lime-300 px-6 py-3 text-xs font-bold uppercase tracking-wide text-black transition hover:bg-lime-200"
            >
              Launch Terminal
            </Link>
            <Link
              href="/docs"
              className="border border-white/25 px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:border-white/60"
            >
              Read the Docs
            </Link>
          </div>
        </div>
        <Footer />
      </section>
    </div>
  );
}
