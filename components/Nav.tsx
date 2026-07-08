import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "./ConnectButton";

export function Nav() {
  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0b0e11]/90 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/quiver-logo.png"
            alt="Quiver"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-base font-extrabold tracking-tight text-white">
            Quiver
          </span>
        </Link>
        <div className="hidden gap-6 text-xs text-neutral-400 sm:flex">
          <Link href="/trade" className="hover:text-white">
            Trade
          </Link>
          <a
            href="https://explorer.testnet.chain.robinhood.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white"
          >
            Explorer
          </a>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-lime-400/30 bg-lime-400/10 px-2.5 py-1 text-[10px] font-medium text-lime-300 sm:inline">
          Robinhood Chain Testnet · 46630
        </span>
        <ConnectButton />
      </div>
    </nav>
  );
}
