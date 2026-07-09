"use client";

import { useEffect, useState } from "react";
import { fmtUsd } from "@/lib/markets";

const STORAGE_KEY = "quiver-demo-v1";

const TRADERS = [
  { name: "arrowmaxi.eth", points: 48210 },
  { name: "0x7f3a…c9d1", points: 35470 },
  { name: "sherwood_sniper", points: 29880 },
  { name: "0xb21e…44af", points: 21055 },
  { name: "hoodrat_perps", points: 17640 },
  { name: "0x90cc…1e07", points: 12980 },
  { name: "fletcher.rh", points: 9420 },
  { name: "0x33d8…b6f2", points: 6135 },
  { name: "quivering_hands", points: 3890 },
];

export function Leaderboard() {
  const [myPoints, setMyPoints] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as { points?: number };
        if (typeof s.points === "number") setMyPoints(s.points);
      }
    } catch {
      // ignore
    }
  }, []);

  const rows = [...TRADERS, { name: "You", points: myPoints }].sort(
    (a, b) => b.points - a.points,
  );

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-[#110e08]">
      <table className="w-full text-left text-sm">
        <thead className="text-[10px] uppercase tracking-wider text-neutral-600">
          <tr className="border-b border-white/10">
            <th className="px-5 py-3">Rank</th>
            <th className="px-5 py-3">Trader</th>
            <th className="px-5 py-3 text-right">Points</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {rows.map((r, i) => {
            const you = r.name === "You";
            return (
              <tr
                key={r.name}
                className={`border-t border-white/5 ${you ? "bg-lime-400/10" : ""}`}
              >
                <td className="px-5 py-3 text-neutral-400">#{i + 1}</td>
                <td
                  className={`px-5 py-3 ${you ? "font-bold text-lime-300" : "text-white"}`}
                >
                  {r.name}
                  {you && (
                    <span className="ml-2 rounded-full border border-lime-400/30 px-2 py-0.5 text-[9px] uppercase">
                      you
                    </span>
                  )}
                </td>
                <td
                  className={`px-5 py-3 text-right ${you ? "text-lime-300" : "text-neutral-200"}`}
                >
                  {fmtUsd(r.points, 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-white/10 px-5 py-3 text-[10px] text-neutral-600">
        Testnet demo leaderboard — other traders are simulated. Your points are
        tracked locally until on-chain accounts go live.
      </p>
    </div>
  );
}
