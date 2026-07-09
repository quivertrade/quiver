import Link from "next/link";
import { GitHubIcon, XIcon } from "./SocialIcons";

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-10 text-[11px] text-neutral-600">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-5 text-neutral-400">
          <Link href="/trade" className="hover:text-lime-300">
            Trade
          </Link>
          <Link href="/docs" className="hover:text-lime-300">
            Docs
          </Link>
          <Link href="/roadmap" className="hover:text-lime-300">
            Roadmap
          </Link>
          <Link href="/token" className="hover:text-lime-300">
            Token
          </Link>
          <Link href="/risk" className="hover:text-lime-300">
            Risk
          </Link>
          <a
            href="https://explorer.testnet.chain.robinhood.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-lime-300"
          >
            Explorer
          </a>
          <a
            href="https://github.com/quivertrade/quiver"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="flex items-center hover:text-lime-300"
          >
            <GitHubIcon />
          </a>
          <a
            href="https://x.com/_Quivertrade"
            target="_blank"
            rel="noreferrer"
            aria-label="X (Twitter)"
            className="flex items-center hover:text-lime-300"
          >
            <XIcon />
          </a>
        </div>
        <div className="text-center">
          Quiver — testnet demo. Not affiliated with Robinhood Markets, Inc.
          Nothing here is financial advice.
        </div>
      </div>
    </footer>
  );
}
