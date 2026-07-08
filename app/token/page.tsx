import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "$QVR Token — Quiver",
  description:
    "The planned $QVR token: utility, allocation and launch plan for the Quiver protocol on Robinhood Chain.",
};

const ALLOCATION = [
  { label: "Community & trading rewards", pct: 40, color: "#a3e635" },
  { label: "Treasury / DAO", pct: 20, color: "#65a30d" },
  { label: "Core contributors (vested)", pct: 20, color: "#4d7c0f" },
  { label: "Liquidity & market making", pct: 10, color: "#84cc16" },
  { label: "Ecosystem & partnerships", pct: 10, color: "#3f6212" },
];

const UTILITY = [
  {
    title: "Fee discounts",
    body: "Stake $QVR to reduce trading fees on all Quiver markets, tiered by stake size.",
  },
  {
    title: "Staking & revenue share",
    body: "A share of protocol trading fees is distributed to $QVR stakers.",
  },
  {
    title: "Insurance backstop",
    body: "Staked $QVR acts as a last-resort backstop for the per-market insurance funds, earning a premium for the risk.",
  },
  {
    title: "Governance",
    body: "Vote on new markets, leverage caps, fee parameters and treasury spending.",
  },
];

const LAUNCH_STEPS = [
  {
    tag: "Step 1",
    title: "Points program (testnet)",
    body: "Trading on the testnet earns Quiver Points — volume, PnL and referral based. Points are the basis for the future airdrop allocation.",
    status: "next" as const,
  },
  {
    tag: "Step 2",
    title: "Token generation event",
    body: "$QVR deployed on Robinhood Chain mainnet at protocol launch. Fixed supply of 1,000,000,000 — no inflation.",
    status: "planned" as const,
  },
  {
    tag: "Step 3",
    title: "Airdrop to early traders",
    body: "Points convert to $QVR. Community allocation streams over time to reward real usage, not mercenary farming.",
    status: "planned" as const,
  },
  {
    tag: "Step 4",
    title: "Staking & governance live",
    body: "Fee-discount tiers, revenue share and on-chain governance activate after launch.",
    status: "planned" as const,
  },
];

const BADGE: Record<string, string> = {
  next: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  planned: "border-white/15 bg-white/5 text-neutral-400",
};

export default function TokenPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-[11px] font-medium text-lime-300">
          Planned — not live yet
        </span>
        <h1 className="font-display mt-5 text-4xl">
          The <span className="text-lime-300">$QVR</span> token
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          $QVR is the planned protocol token of Quiver, launching alongside the
          mainnet release on Robinhood Chain. Fixed supply of{" "}
          <strong className="text-neutral-200">1,000,000,000 QVR</strong>. There
          is no token today — anything claiming to be $QVR before the official
          announcement on{" "}
          <a
            href="https://x.com/_Quivertrade"
            target="_blank"
            rel="noreferrer"
            className="text-lime-300 hover:underline"
          >
            @_Quivertrade
          </a>{" "}
          is a scam.
        </p>

        <h2 className="mt-12 text-lg font-bold">Utility</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {UTILITY.map((u) => (
            <div
              key={u.title}
              className="rounded-lg border border-white/10 bg-[#110e08] p-5"
            >
              <h3 className="text-sm font-semibold text-lime-300">{u.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                {u.body}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-lg font-bold">Allocation</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#110e08] p-5">
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {ALLOCATION.map((a) => (
              <div
                key={a.label}
                style={{ width: `${a.pct}%`, background: a.color }}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-neutral-400">
            {ALLOCATION.map((a) => (
              <li key={a.label} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: a.color }}
                />
                <span>{a.label}</span>
                <span className="ml-auto font-mono text-neutral-200">
                  {a.pct}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <h2 className="mt-12 text-lg font-bold">Launch plan</h2>
        <div className="mt-4 space-y-4">
          {LAUNCH_STEPS.map((s) => (
            <div
              key={s.tag}
              className="rounded-xl border border-white/10 bg-[#110e08] p-5"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                  {s.tag}
                </span>
                <h3 className="text-sm font-bold text-white">{s.title}</h3>
                <span
                  className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${BADGE[s.status]}`}
                >
                  {s.status}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-neutral-500">
          All figures are provisional and subject to change before the token
          generation event. $QVR will not be offered where prohibited. Nothing
          here is financial advice — see the{" "}
          <Link href="/risk" className="text-lime-300 hover:underline">
            risk disclaimer
          </Link>
          .
        </p>

        <div className="mt-16 flex flex-wrap gap-5 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.15em] text-neutral-500">
          <Link href="/trade" className="hover:text-lime-300">
            Open the app
          </Link>
          <Link href="/roadmap" className="hover:text-lime-300">
            Roadmap
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
