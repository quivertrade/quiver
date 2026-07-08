import { Nav } from "@/components/Nav";
import { TradeTerminal } from "@/components/TradeTerminal";

export const metadata = { title: "Trade — Quiver" };

export default function TradePage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Nav />
      <TradeTerminal />
    </div>
  );
}
