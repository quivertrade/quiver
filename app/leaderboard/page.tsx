import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata = { title: "Points & Leaderboard — Quiver" };

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-display text-4xl text-white">
          Points & <span className="italic text-lime-300">leaderboard</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-neutral-400">
          Every $100 of notional volume traded on testnet earns 1 point, with a
          20% bonus on profitable closes. Points convert to a $QVR airdrop
          allocation at TGE — see the{" "}
          <a href="/token" className="text-lime-300 hover:underline">
            token plan
          </a>
          .
        </p>
        <Leaderboard />
      </main>
      <Footer />
    </div>
  );
}
