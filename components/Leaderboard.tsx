"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtUsd } from "@/lib/markets";
import { getHandle, setHandle as saveHandle, syncPoints } from "@/lib/leaderboard";

const STORAGE_KEY = "quiver-demo-v1";

interface Row {
  handle: string;
  points: number;
  pnl: number;
}

export function Leaderboard() {
  const [myPoints, setMyPoints] = useState(0);
  const [myPnl, setMyPnl] = useState(0);
  const [handle, setHandle] = useState("");
  const [draft, setDraft] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) setRows((await res.json()) as Row[]);
      else setRows([]);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    let points = 0;
    let pnl = 0;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as {
          points?: number;
          history?: { pnl: number }[];
        };
        if (typeof s.points === "number") points = s.points;
        if (Array.isArray(s.history))
          pnl = s.history.reduce((a, h) => a + (h.pnl ?? 0), 0);
      }
    } catch {
      // ignore
    }
    setMyPoints(points);
    setMyPnl(pnl);
    const h = getHandle();
    setHandle(h);
    setDraft(h);
    (async () => {
      if (h) await syncPoints(points, pnl);
      await load();
    })();
  }, [load]);

  const submit = async () => {
    const h = draft.trim().slice(0, 20);
    if (!h) return;
    saveHandle(h);
    setHandle(h);
    setEditing(false);
    await syncPoints(myPoints, myPnl);
    await load();
  };

  const display = rows ?? [];
  const onBoard = handle && display.some((r) => r.handle === handle);
  const merged =
    handle && !onBoard
      ? [...display, { handle, points: Math.round(myPoints), pnl: myPnl }].sort(
          (a, b) => b.points - a.points,
        )
      : display;

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#110e08] px-4 py-3">
        {handle && !editing ? (
          <>
            <span className="text-xs text-neutral-400">
              Competing as{" "}
              <span className="font-mono font-bold text-lime-300">{handle}</span>{" "}
              · {fmtUsd(myPoints, 0)} pts
            </span>
            <button
              onClick={() => setEditing(true)}
              className="ml-auto rounded border border-white/15 px-2 py-1 text-[10px] text-neutral-400 hover:bg-white/5 hover:text-white"
            >
              Change name
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-neutral-400">
              Pick a trader name to join the board:
            </span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={20}
              placeholder="e.g. arrowmaxi"
              className="w-40 rounded-md border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-lime-400/50"
            />
            <button
              onClick={submit}
              className="rounded-md bg-lime-400 px-3 py-1.5 text-[11px] font-bold text-black hover:bg-lime-300"
            >
              Join
            </button>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#110e08]">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-neutral-600">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3">Rank</th>
              <th className="px-5 py-3">Trader</th>
              <th className="hidden px-5 py-3 text-right sm:table-cell">
                Realized PnL
              </th>
              <th className="px-5 py-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {rows === null ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-neutral-600">
                  Loading leaderboard…
                </td>
              </tr>
            ) : merged.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-neutral-600">
                  No traders yet — set a name above and start trading to claim
                  #1.
                </td>
              </tr>
            ) : (
              merged.map((r, i) => {
                const you = !!handle && r.handle === handle;
                return (
                  <tr
                    key={`${r.handle}-${i}`}
                    className={`border-t border-white/5 ${you ? "bg-lime-400/10" : ""}`}
                  >
                    <td className="px-5 py-3 text-neutral-400">#{i + 1}</td>
                    <td
                      className={`px-5 py-3 ${you ? "font-bold text-lime-300" : "text-white"}`}
                    >
                      {r.handle}
                      {you && (
                        <span className="ml-2 rounded-full border border-lime-400/30 px-2 py-0.5 text-[9px] uppercase">
                          you
                        </span>
                      )}
                    </td>
                    <td
                      className={`hidden px-5 py-3 text-right sm:table-cell ${
                        r.pnl >= 0 ? "text-lime-300/80" : "text-red-400/80"
                      }`}
                    >
                      {r.pnl >= 0 ? "+" : ""}${fmtUsd(r.pnl, 0)}
                    </td>
                    <td
                      className={`px-5 py-3 text-right ${you ? "text-lime-300" : "text-neutral-200"}`}
                    >
                      {fmtUsd(r.points, 0)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <p className="border-t border-white/10 px-5 py-3 text-[10px] text-neutral-600">
          Live testnet leaderboard — points sync when you trade with a name set.
          Points convert to a $QVR airdrop allocation at TGE.
        </p>
      </div>
    </div>
  );
}
