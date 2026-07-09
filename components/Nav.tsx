"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "./ConnectButton";

const LINKS = [
  { href: "/trade", label: "Trade" },
  { href: "/docs", label: "Docs" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/token", label: "Token" },
];

const EXTERNAL = [
  { href: "https://explorer.testnet.chain.robinhood.com", label: "Explorer" },
  { href: "https://x.com/_Quivertrade", label: "X" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-[#000000]/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
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
          <div className="hidden gap-6 text-xs text-neutral-400 md:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
            {EXTERNAL.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-lime-400/30 bg-lime-400/10 px-2.5 py-1 text-[10px] font-medium text-lime-300 lg:inline">
            Robinhood Chain Testnet · 46630
          </span>
          <ConnectButton />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-neutral-300 md:hidden"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              {open ? (
                <>
                  <path d="M3 3l10 10" />
                  <path d="M13 3L3 13" />
                </>
              ) : (
                <>
                  <path d="M2 4.5h12" />
                  <path d="M2 8h12" />
                  <path d="M2 11.5h12" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1 text-sm text-neutral-300">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            {EXTERNAL.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-md px-2 py-2.5 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>
          <span className="mt-2 inline-block rounded-full border border-lime-400/30 bg-lime-400/10 px-2.5 py-1 text-[10px] font-medium text-lime-300">
            Robinhood Chain Testnet · 46630
          </span>
        </div>
      )}
    </nav>
  );
}
