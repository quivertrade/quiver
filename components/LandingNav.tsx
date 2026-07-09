"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/trade", label: "Trade" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/docs", label: "Docs" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/token", label: "Token" },
  { href: "/leaderboard", label: "Points" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/quiver-logo.png"
            alt="Quiver"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="font-display text-xl font-semibold tracking-tight">
            Quiver
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-black">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/token"
            className="hidden items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-xs font-bold transition hover:border-black/30 sm:flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
            $QVR
            <span className="font-normal text-neutral-500">testnet</span>
          </Link>
          <Link
            href="/trade"
            className="bg-black px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
          >
            Launch Terminal
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center border border-black/10 text-lg md:hidden"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-black/10 px-6 py-3 md:hidden">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm text-neutral-700 hover:text-black"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/token"
            onClick={() => setOpen(false)}
            className="block py-2.5 text-sm text-neutral-700 hover:text-black"
          >
            $QVR Token
          </Link>
        </nav>
      )}
    </header>
  );
}
