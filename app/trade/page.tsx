import { Nav } from "@/components/Nav";
import { TradeTerminal } from "@/components/TradeTerminal";

export const metadata = { title: "Trade — Quiver" };

export default function TradePage() {
  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <Nav />
      <TradeTerminal />
    </div>
  );
}
