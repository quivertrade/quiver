"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  MARKETS,
  type MarketKey,
  type Position,
  marketByKey,
  genCandles,
  pnl,
  liqPrice,
  fmtUsd,
} from "@/lib/markets";
import { Chart } from "./Chart";

const MAX_LEV = 20;

export function TradeTerminal() {
  const { isConnected } = useAccount();
  const [selected, setSelected] = useState<MarketKey>("TSLA");
  const [side, setSide] = useState<"long" | "short">("long");
  const [margin, setMargin] = useState("100");
  const [leverage, setLeverage] = useState(5);
  const [positions, setPositions] = useState<Position[]>([]);
  const [balance, setBalance] = useState(10_000);
  const [tick, setTick] = useState(0);

  // live mark prices: random walk from candle close
  const [marks, setMarks] = useState<Record<MarketKey, number>>(() =>
    Object.fromEntries(
      MARKETS.map((m) => [m.key, genCandles(m).at(-1)!.c]),
    ) as Record<MarketKey, number>,
  );

  useEffect(() => {
    const id = setInterval(() => {
      setMarks((prev) => {
        const next = { ...prev };
        for (const m of MARKETS) {
          const jitter = (Math.random() - 0.5) * 2 * m.volatility * prev[m.key];
          next[m.key] = Math.max(0.01, prev[m.key] + jitter);
        }
        return next;
      });
      setTick((t) => t + 1);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const market = marketByKey(selected);
  const candles = useMemo(() => genCandles(market), [market]);
  const mark = marks[selected];
  const marginNum = Math.max(0, Number(margin) || 0);
  const notional = marginNum * leverage;

  const open = () => {
    if (marginNum <= 0 || marginNum > balance) return;
    setPositions((ps) => [
      ...ps,
      {
        id: Date.now(),
        market: selected,
        side,
        size: notional,
        margin: marginNum,
        leverage,
        entry: mark,
      },
    ]);
    setBalance((b) => b - marginNum);
  };

  const close = (p: Position) => {
    setBalance((b) => b + p.margin + pnl(p, marks[p.market]));
    setPositions((ps) => ps.filter((x) => x.id !== p.id));
  };

  const totalPnl = positions.reduce((s, p) => s + pnl(p, marks[p.market]), 0);
  void tick;

  return (
    <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-[220px_1fr_300px]">
      {/* Markets */}
      <div className="rounded-lg border border-white/10 bg-[#101418]">
        <div className="border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Tokenized Stock Perps
        </div>
        <ul>
          {MARKETS.map((m) => {
            const active = m.key === selected;
            return (
              <li key={m.key}>
                <button
                  onClick={() => setSelected(m.key)}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-white/5 ${
                    active ? "bg-white/5" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: m.color }}
                    />
                    <span className="font-mono text-xs text-white">
                      {m.label}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-neutral-300">
                    {fmtUsd(marks[m.key])}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Chart + positions */}
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-white/10 bg-[#101418] p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <div>
              <span className="font-mono text-sm font-bold text-white">
                {market.label}
              </span>
              <span className="ml-2 text-xs text-neutral-500">
                {market.name}
              </span>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-bold text-lime-300">
                ${fmtUsd(mark)}
              </div>
              <div className="text-[10px] text-neutral-500">
                Mark · vAMM demo feed
              </div>
            </div>
          </div>
          <div className="h-64">
            <Chart candles={candles} />
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#101418]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Positions ({positions.length})
            </span>
            <span
              className={`font-mono text-xs ${totalPnl >= 0 ? "text-lime-300" : "text-red-400"}`}
            >
              {totalPnl >= 0 ? "+" : ""}
              {fmtUsd(totalPnl)} USD
            </span>
          </div>
          {positions.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-neutral-600">
              No open positions. Open one from the order panel.
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-neutral-600">
                <tr>
                  <th className="px-3 py-2">Market</th>
                  <th className="px-2 py-2">Side</th>
                  <th className="px-2 py-2">Size</th>
                  <th className="px-2 py-2">Entry</th>
                  <th className="px-2 py-2">Liq.</th>
                  <th className="px-2 py-2">PnL</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="font-mono">
                {positions.map((p) => {
                  const v = pnl(p, marks[p.market]);
                  return (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="px-3 py-2 text-white">
                        {marketByKey(p.market).label}
                      </td>
                      <td
                        className={`px-2 py-2 ${p.side === "long" ? "text-lime-300" : "text-red-400"}`}
                      >
                        {p.side.toUpperCase()} {p.leverage}x
                      </td>
                      <td className="px-2 py-2 text-neutral-300">
                        ${fmtUsd(p.size, 0)}
                      </td>
                      <td className="px-2 py-2 text-neutral-300">
                        {fmtUsd(p.entry)}
                      </td>
                      <td className="px-2 py-2 text-amber-400">
                        {fmtUsd(liqPrice(p))}
                      </td>
                      <td
                        className={`px-2 py-2 ${v >= 0 ? "text-lime-300" : "text-red-400"}`}
                      >
                        {v >= 0 ? "+" : ""}
                        {fmtUsd(v)}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => close(p)}
                          className="rounded border border-white/20 px-2 py-0.5 text-[10px] text-neutral-300 hover:bg-white/10"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Order panel */}
      <div className="rounded-lg border border-white/10 bg-[#101418] p-3">
        <div className="mb-3 flex justify-between text-xs">
          <span className="text-neutral-500">Balance (demo tUSDC)</span>
          <span className="font-mono text-white">${fmtUsd(balance)}</span>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-md bg-black/40 p-1">
          <button
            onClick={() => setSide("long")}
            className={`rounded px-3 py-2 text-xs font-semibold ${
              side === "long"
                ? "bg-lime-400 text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Long
          </button>
          <button
            onClick={() => setSide("short")}
            className={`rounded px-3 py-2 text-xs font-semibold ${
              side === "short"
                ? "bg-red-500 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Short
          </button>
        </div>

        <label className="mb-1 block text-[11px] text-neutral-500">
          Margin (tUSDC)
        </label>
        <input
          value={margin}
          onChange={(e) => setMargin(e.target.value)}
          inputMode="decimal"
          className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:border-lime-400/50"
        />

        <label className="mb-1 flex justify-between text-[11px] text-neutral-500">
          <span>Leverage</span>
          <span className="font-mono text-white">{leverage}x</span>
        </label>
        <input
          type="range"
          min={1}
          max={MAX_LEV}
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          className="mb-3 w-full accent-lime-400"
        />

        <div className="mb-3 space-y-1 rounded-md bg-black/30 p-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-neutral-500">Notional</span>
            <span className="font-mono text-white">${fmtUsd(notional)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Entry (mark)</span>
            <span className="font-mono text-white">${fmtUsd(mark)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Est. liq. price</span>
            <span className="font-mono text-amber-400">
              {marginNum > 0
                ? fmtUsd(
                    liqPrice({
                      id: 0,
                      market: selected,
                      side,
                      size: notional,
                      margin: marginNum,
                      leverage,
                      entry: mark,
                    }),
                  )
                : "—"}
            </span>
          </div>
        </div>

        <button
          onClick={open}
          disabled={marginNum <= 0 || marginNum > balance}
          className={`w-full rounded-md py-2.5 text-sm font-bold disabled:opacity-40 ${
            side === "long"
              ? "bg-lime-400 text-black "
              : "bg-red-500 text-white hover:bg-red-400"
          }`}
        >
          {side === "long" ? "Open Long" : "Open Short"} {market.label}
        </button>
        {!isConnected && (
          <p className="mt-2 text-center text-[10px] text-neutral-600">
            Demo mode — connect a wallet on Robinhood Chain Testnet for the
            on-chain flow (contracts coming soon).
          </p>
        )}
      </div>
    </div>
  );
}
