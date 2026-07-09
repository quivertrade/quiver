"use client";

import { useEffect, useMemo, useState } from "react";
import {
  marketByKey,
  fmtUsd,
  type ClosedTrade,
  type Position,
} from "@/lib/markets";
import { sharePnlCard } from "@/lib/shareCard";

const STORAGE_KEY = "quiver-demo-v1";

interface Stored {
  balance?: number;
  positions?: Position[];
  history?: ClosedTrade[];
  points?: number;
}

export function Portfolio() {
  const [data, setData] = useState<Stored | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setData(raw ? (JSON.parse(raw) as Stored) : {});
    } catch {
      setData({});
    }
  }, []);

  const history = useMemo(
    () => [...(data?.history ?? [])].sort((a, b) => a.t - b.t),
    [data],
  );

  const curve = useMemo(() => {
    let cum = 0;
    return history.map((h) => {
      cum += h.pnl;
      return { t: h.t, v: cum };
    });
  }, [history]);

  if (!data) {
    return <p className="py-16 text-center text-xs text-neutral-600">Loading…</p>;
  }

  const totalPnl = history.reduce((s, h) => s + h.pnl, 0);
  const wins = history.filter((h) => h.pnl > 0).length;
  const winRate = history.length ? (wins / history.length) * 100 : 0;
  const best = history.length
    ? history.reduce((a, b) => (a.pnl > b.pnl ? a : b))
    : null;
  const worst = history.length
    ? history.reduce((a, b) => (a.pnl < b.pnl ? a : b))
    : null;
  const openMargin = (data.positions ?? []).reduce((s, p) => s + p.margin, 0);
  const balance = data.balance ?? 10_000;

  const w = 800;
  const h = 220;
  const pad = 10;
  let path = "";
  let zeroY = h / 2;
  if (curve.length > 1) {
    const min = Math.min(0, ...curve.map((c) => c.v));
    const max = Math.max(0, ...curve.map((c) => c.v));
    const span = max - min || 1;
    const x = (i: number) => pad + (i / (curve.length - 1)) * (w - pad * 2);
    const y = (v: number) => pad + (1 - (v - min) / span) * (h - pad * 2);
    zeroY = y(0);
    path =
      `M ${x(0)} ${y(0)} ` +
      curve.map((c, i) => `L ${x(i)} ${y(c.v)}`).join(" ");
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Free balance" value={`$${fmtUsd(balance)}`} />
        <StatCard label="Margin in positions" value={`$${fmtUsd(openMargin)}`} />
        <StatCard
          label="Realized PnL"
          value={`${totalPnl >= 0 ? "+" : ""}$${fmtUsd(totalPnl)}`}
          tone={totalPnl >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Win rate"
          value={history.length ? `${winRate.toFixed(0)}% (${wins}/${history.length})` : "—"}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a0a06] p-5">
        <h2 className="text-sm font-semibold text-white">
          Realized PnL over time
        </h2>
        {curve.length < 2 ? (
          <p className="py-14 text-center text-xs text-neutral-600">
            Close at least two trades to see your PnL curve.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="mt-3 w-full"
            preserveAspectRatio="none"
          >
            <line
              x1={pad}
              x2={w - pad}
              y1={zeroY}
              y2={zeroY}
              stroke="#ffffff18"
              strokeDasharray="4 4"
            />
            <path
              d={path}
              fill="none"
              stroke={totalPnl >= 0 ? "#ccff00" : "#f87171"}
              strokeWidth="2"
            />
          </svg>
        )}
      </div>

      {(best || worst) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {best && best.pnl > 0 && (
            <TradeCard title="Best trade" trade={best} />
          )}
          {worst && worst.pnl < 0 && (
            <TradeCard title="Worst trade" trade={worst} />
          )}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#0a0a06]">
        <div className="border-b border-white/10 px-5 py-3 text-sm font-semibold text-white">
          Closed trades ({history.length})
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-10 text-center text-xs text-neutral-600">
            No closed trades yet —{" "}
            <a href="/trade" className="text-lime-300 hover:underline">
              open the terminal
            </a>{" "}
            to start trading.
          </p>
        ) : (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-neutral-600">
                <tr>
                  <th className="px-5 py-2">Market</th>
                  <th className="px-2 py-2">Side</th>
                  <th className="px-2 py-2">Size</th>
                  <th className="px-2 py-2">Entry → Exit</th>
                  <th className="px-2 py-2">PnL</th>
                  <th className="px-2 py-2">When</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="font-mono">
                {[...history].reverse().map((tr) => (
                  <tr key={tr.id} className="border-t border-white/5">
                    <td className="px-5 py-2 text-white">
                      {marketByKey(tr.market).label}
                    </td>
                    <td
                      className={`px-2 py-2 ${tr.side === "long" ? "text-lime-300" : "text-red-400"}`}
                    >
                      {tr.side.toUpperCase()} {tr.leverage}x
                    </td>
                    <td className="px-2 py-2 text-neutral-300">
                      ${fmtUsd(tr.size, 0)}
                    </td>
                    <td className="px-2 py-2 text-neutral-300">
                      {fmtUsd(tr.entry)} → {fmtUsd(tr.exit)}
                    </td>
                    <td
                      className={`px-2 py-2 ${tr.pnl >= 0 ? "text-lime-300" : "text-red-400"}`}
                    >
                      {tr.pnl >= 0 ? "+" : ""}
                      {fmtUsd(tr.pnl)}
                    </td>
                    <td className="px-2 py-2 text-neutral-500">
                      {new Date(tr.t).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => sharePnlCard(tr)}
                        className="rounded border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[10px] text-lime-300 hover:bg-lime-400/20"
                      >
                        Share
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a06] p-4">
      <div className="text-[10px] uppercase tracking-wider text-neutral-600">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-lg font-bold ${
          tone === "up"
            ? "text-lime-300"
            : tone === "down"
              ? "text-red-400"
              : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function TradeCard({ title, trade }: { title: string; trade: ClosedTrade }) {
  const pct = (trade.pnl / (trade.size / trade.leverage)) * 100;
  const win = trade.pnl >= 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a06] p-4">
      <div className="text-[10px] uppercase tracking-wider text-neutral-600">
        {title}
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="font-mono text-sm text-white">
          {marketByKey(trade.market).label}{" "}
          <span className={win ? "text-lime-300" : "text-red-400"}>
            {trade.side.toUpperCase()} {trade.leverage}x
          </span>
        </span>
        <span
          className={`font-mono text-lg font-bold ${win ? "text-lime-300" : "text-red-400"}`}
        >
          {pct >= 0 ? "+" : ""}
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
