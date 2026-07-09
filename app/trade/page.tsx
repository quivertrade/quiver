import { Nav } from "@/components/Nav";
import { TradeTerminal } from "@/components/TradeTerminal";
import { MARKETS, type MarketKey } from "@/lib/markets";

export const metadata = { title: "Trade — Quiver" };

export default async function TradePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const initialMarket = MARKETS.some((x) => x.key === m)
    ? (m as MarketKey)
    : undefined;
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Nav />
      <TradeTerminal initialMarket={initialMarket} />
    </div>
  );
}
