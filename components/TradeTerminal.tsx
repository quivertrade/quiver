"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import {
  MARKETS,
  type MarketKey,
  type Position,
  type Trade,
  marketByKey,
  genCandles,
  pnl,
  pnlPct,
  liqPrice,
  dayStats,
  fundingRate,
  orderBook,
  genTrade,
  fmtUsd,
  fmtCompact,
} from "@/lib/markets";
import { Chart } from "./Chart";

const MAX_LEV = 20;
type OrderType = "market" | "limit";
type Tab = "positions" | "book" | "trades";
type Toast = { id: number; kind: "ok" | "warn" | "info"; msg: string };

export function TradeTerminal() {
  const { isConnected } = useAccount();
  const [selected, setSelected] = useState<MarketKey>("TSLA");
  const [side, setSide] = useState<"long" | "short">("long");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [margin, setMargin] = useState("100");
  const [leverage, setLeverage] = useState(5);
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slEnabled, setSlEnabled] = useState(false);
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [balance, setBalance] = useState(10_000);
  const [tab, setTab] = useState<Tab>("positions");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [, setTick] = useState(0);

  const [marks, setMarks] = useState<Record<MarketKey, number>>(() =>
    Object.fromEntries(
      MARKETS.map((m) => [m.key, genCandles(m).at(-1)!.c]),
    ) as Record<MarketKey, number>,
  );

  const toast = useCallback((kind: Toast["kind"], msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  // keep latest positions in a ref so the interval can auto-close TP/SL/liq
  const posRef = useRef(positions);
  posRef.current = positions;

  const closeInternal = useCallback(
    (p: Position, mk: number, reason?: string) => {
      setBalance((b) => b + p.margin + pnl(p, mk));
      setPositions((ps) => ps.filter((x) => x.id !== p.id));
      if (reason) {
        const v = pnl(p, mk);
        toast(
          reason === "Liquidated" ? "warn" : "info",
          `${reason} ${marketByKey(p.market).label} · ${v >= 0 ? "+" : ""}$${fmtUsd(v)}`,
        );
      }
    },
    [toast],
  );

  useEffect(() => {
    const id = setInterval(() => {
      setMarks((prev) => {
        const next = { ...prev };
        for (const m of MARKETS) {
          const jitter = (Math.random() - 0.5) * 2 * m.volatility * prev[m.key];
          next[m.key] = Math.max(0.01, prev[m.key] + jitter);
        }
        // auto-trigger TP / SL / liquidation
        for (const p of posRef.current) {
          const mk = next[p.market];
          const liq = liqPrice(p);
          const hitLiq = p.side === "long" ? mk <= liq : mk >= liq;
          const hitTp =
            p.tp != null && (p.side === "long" ? mk >= p.tp : mk <= p.tp);
          const hitSl =
            p.sl != null && (p.side === "long" ? mk <= p.sl : mk >= p.sl);
          if (hitLiq) closeInternal(p, mk, "Liquidated");
          else if (hitTp) closeInternal(p, mk, "Take-profit");
          else if (hitSl) closeInternal(p, mk, "Stop-loss");
        }
        return next;
      });
      setTrades((prev) => [genTrade(marksRef.current[selectedRef.current]), ...prev].slice(0, 30));
      setTick((t) => t + 1);
    }, 1500);
    return () => clearInterval(id);
  }, [closeInternal]);

  // refs to read fresh values inside interval
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const market = marketByKey(selected);
  const candles = useMemo(() => genCandles(market), [market]);
  const mark = marks[selected];
  const stats = dayStats(market, mark);
  const funding = fundingRate(market, mark);
  const book = useMemo(() => orderBook(mark), [mark]);

  const marginNum = Math.max(0, Number(margin) || 0);
  const notional = marginNum * leverage;
  const entryPrice =
    orderType === "limit" && Number(limitPrice) > 0 ? Number(limitPrice) : mark;

  const usedMargin = positions.reduce((s, p) => s + p.margin, 0);
  const totalPnl = positions.reduce((s, p) => s + pnl(p, marks[p.market]), 0);
  const equity = balance + usedMargin + totalPnl;

  const setMarginPct = (pct: number) =>
    setMargin(((balance * pct) / 100).toFixed(0));

  const open = () => {
    if (marginNum <= 0) return toast("warn", "Enter a margin amount");
    if (marginNum > balance) return toast("warn", "Insufficient balance");
    const tpNum = tpEnabled ? Number(tp) : undefined;
    const slNum = slEnabled ? Number(sl) : undefined;
    setPositions((ps) => [
      ...ps,
      {
        id: Date.now(),
        market: selected,
        side,
        size: notional,
        margin: marginNum,
        leverage,
        entry: entryPrice,
        tp: tpNum && tpNum > 0 ? tpNum : undefined,
        sl: slNum && slNum > 0 ? slNum : undefined,
      },
    ]);
    setBalance((b) => b - marginNum);
    toast(
      "ok",
      `Opened ${side.toUpperCase()} ${market.label} · $${fmtUsd(notional, 0)} @ ${fmtUsd(entryPrice)}`,
    );
  };

  const closeFull = (p: Position) => closeInternal(p, marks[p.market], "Closed");

  const closeHalf = (p: Position) => {
    const mk = marks[p.market];
    const realized = pnl(p, mk) / 2;
    setBalance((b) => b + p.margin / 2 + realized);
    setPositions((ps) =>
      ps.map((x) =>
        x.id === p.id
          ? { ...x, size: x.size / 2, margin: x.margin / 2 }
          : x,
      ),
    );
    toast("info", `Closed 50% ${marketByKey(p.market).label}`);
  };

  const previewLiq =
    marginNum > 0
      ? liqPrice({
          id: 0,
          market: selected,
          side,
          size: notional,
          margin: marginNum,
          leverage,
          entry: entryPrice,
        })
      : null;

  return (
    <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-[210px_1fr_300px]">
      {/* Toasts */}
      <div className="pointer-events-none fixed right-4 top-16 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-2.5 text-xs shadow-lg backdrop-blur ${
              t.kind === "ok"
                ? "border-lime-400/40 bg-lime-400/10 text-lime-200"
                : t.kind === "warn"
                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                  : "border-white/20 bg-white/10 text-neutral-100"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>

      {/* Markets */}
      <div className="rounded-lg border border-white/10 bg-[#110e08]">
        <div className="border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Markets
        </div>
        <ul className="flex overflow-x-auto lg:block">
          {MARKETS.map((m) => {
            const active = m.key === selected;
            const chg = dayStats(m, marks[m.key]).changePct;
            return (
              <li key={m.key} className="min-w-[130px] flex-1 lg:min-w-0">
                <button
                  onClick={() => setSelected(m.key)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-white/5 ${
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
                  <span className="text-right">
                    <span className="block font-mono text-xs text-neutral-200">
                      {fmtUsd(marks[m.key])}
                    </span>
                    <span
                      className={`block font-mono text-[10px] ${chg >= 0 ? "text-lime-300" : "text-red-400"}`}
                    >
                      {chg >= 0 ? "+" : ""}
                      {chg.toFixed(2)}%
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Chart + tabs */}
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-white/10 bg-[#110e08] p-3">
          {/* stats bar */}
          <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <div className="font-mono text-sm font-bold text-white">
                {market.label}
              </div>
              <div className="text-[10px] text-neutral-500">{market.name}</div>
            </div>
            <div>
              <div className="font-mono text-lg font-bold text-lime-300">
                ${fmtUsd(mark)}
              </div>
              <div className="text-[10px] text-neutral-500">Mark price</div>
            </div>
            <Stat
              label="24h Change"
              value={`${stats.changePct >= 0 ? "+" : ""}${stats.changePct.toFixed(2)}%`}
              tone={stats.changePct >= 0 ? "up" : "down"}
            />
            <Stat label="24h High" value={fmtUsd(stats.high)} />
            <Stat label="24h Low" value={fmtUsd(stats.low)} />
            <Stat label="24h Volume" value={`$${fmtCompact(stats.volume)}`} />
            <Stat
              label="Funding / 8h"
              value={`${funding >= 0 ? "+" : ""}${funding.toFixed(4)}%`}
              tone={funding >= 0 ? "up" : "down"}
            />
          </div>
          <div className="h-56 sm:h-64">
            <Chart candles={candles} mark={mark} />
          </div>
        </div>

        {/* tabbed panel */}
        <div className="rounded-lg border border-white/10 bg-[#110e08]">
          <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider">
            {(
              [
                ["positions", `Positions (${positions.length})`],
                ["book", "Order Book"],
                ["trades", "Trades"],
              ] as [Tab, string][]
            ).map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded px-2.5 py-1 ${
                  tab === k
                    ? "bg-white/10 text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {lbl}
              </button>
            ))}
            {tab === "positions" && positions.length > 0 && (
              <span
                className={`ml-auto font-mono text-xs ${totalPnl >= 0 ? "text-lime-300" : "text-red-400"}`}
              >
                uPnL {totalPnl >= 0 ? "+" : ""}
                {fmtUsd(totalPnl)}
              </span>
            )}
          </div>

          {tab === "positions" &&
            (positions.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-neutral-600">
                No open positions. Open one from the order panel.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase text-neutral-600">
                    <tr>
                      <th className="px-3 py-2">Market</th>
                      <th className="px-2 py-2">Side</th>
                      <th className="px-2 py-2">Size</th>
                      <th className="px-2 py-2">Entry</th>
                      <th className="px-2 py-2">Mark</th>
                      <th className="px-2 py-2">Liq.</th>
                      <th className="px-2 py-2">TP / SL</th>
                      <th className="px-2 py-2">PnL</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {positions.map((p) => {
                      const mk = marks[p.market];
                      const v = pnl(p, mk);
                      const pct = pnlPct(p, mk);
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
                          <td className="px-2 py-2 text-neutral-300">
                            {fmtUsd(mk)}
                          </td>
                          <td className="px-2 py-2 text-amber-400">
                            {fmtUsd(liqPrice(p))}
                          </td>
                          <td className="px-2 py-2 text-neutral-400">
                            {p.tp ? fmtUsd(p.tp) : "—"} /{" "}
                            {p.sl ? fmtUsd(p.sl) : "—"}
                          </td>
                          <td
                            className={`px-2 py-2 ${v >= 0 ? "text-lime-300" : "text-red-400"}`}
                          >
                            {v >= 0 ? "+" : ""}
                            {fmtUsd(v)}
                            <span className="ml-1 text-[10px] opacity-70">
                              ({pct >= 0 ? "+" : ""}
                              {pct.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() => closeHalf(p)}
                                className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] text-neutral-300 hover:bg-white/10"
                              >
                                50%
                              </button>
                              <button
                                onClick={() => closeFull(p)}
                                className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] text-neutral-300 hover:bg-white/10"
                              >
                                Close
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === "book" && (
            <div className="grid grid-cols-2 gap-px p-2 font-mono text-[11px]">
              <div>
                <div className="mb-1 flex justify-between px-1 text-[10px] uppercase text-neutral-600">
                  <span>Bid</span>
                  <span>Size</span>
                </div>
                {book.bids.map((l, i) => (
                  <div key={i} className="relative flex justify-between px-1 py-0.5">
                    <span
                      className="absolute inset-y-0 right-0 bg-lime-400/10"
                      style={{ width: `${(l.total / book.bids.at(-1)!.total) * 100}%` }}
                    />
                    <span className="relative text-lime-300">{fmtUsd(l.price)}</span>
                    <span className="relative text-neutral-400">{l.size}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-1 flex justify-between px-1 text-[10px] uppercase text-neutral-600">
                  <span>Ask</span>
                  <span>Size</span>
                </div>
                {book.asks.map((l, i) => (
                  <div key={i} className="relative flex justify-between px-1 py-0.5">
                    <span
                      className="absolute inset-y-0 left-0 bg-red-500/10"
                      style={{ width: `${(l.total / book.asks.at(-1)!.total) * 100}%` }}
                    />
                    <span className="relative text-red-400">{fmtUsd(l.price)}</span>
                    <span className="relative text-neutral-400">{l.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "trades" && (
            <div className="max-h-56 overflow-y-auto p-2 font-mono text-[11px]">
              <div className="mb-1 flex justify-between px-1 text-[10px] uppercase text-neutral-600">
                <span>Price</span>
                <span>Size</span>
                <span>Time</span>
              </div>
              {trades.length === 0 ? (
                <p className="py-4 text-center text-neutral-600">Waiting for trades…</p>
              ) : (
                trades.map((t, i) => (
                  <div key={i} className="flex justify-between px-1 py-0.5">
                    <span className={t.side === "buy" ? "text-lime-300" : "text-red-400"}>
                      {fmtUsd(t.price)}
                    </span>
                    <span className="text-neutral-400">{t.size}</span>
                    <span className="text-neutral-600">
                      {new Date(t.t).toLocaleTimeString("en-US", { hour12: false })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order panel */}
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-white/10 bg-[#110e08] p-3">
          {/* account summary */}
          <div className="mb-3 grid grid-cols-3 gap-2 rounded-md bg-black/30 p-2 text-center">
            <div>
              <div className="font-mono text-xs text-white">${fmtUsd(equity)}</div>
              <div className="text-[9px] uppercase text-neutral-600">Equity</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white">${fmtUsd(balance)}</div>
              <div className="text-[9px] uppercase text-neutral-600">Free</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white">${fmtUsd(usedMargin)}</div>
              <div className="text-[9px] uppercase text-neutral-600">Used</div>
            </div>
          </div>

          {/* order type */}
          <div className="mb-3 flex gap-4 text-xs">
            {(["market", "limit"] as OrderType[]).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`capitalize ${
                  orderType === t
                    ? "font-semibold text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* side */}
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

          {orderType === "limit" && (
            <>
              <label className="mb-1 block text-[11px] text-neutral-500">
                Limit Price
              </label>
              <input
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                inputMode="decimal"
                placeholder={fmtUsd(mark)}
                className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:border-lime-400/50"
              />
            </>
          )}

          <label className="mb-1 block text-[11px] text-neutral-500">
            Margin (tUSDC)
          </label>
          <input
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            inputMode="decimal"
            className="mb-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:border-lime-400/50"
          />
          <div className="mb-3 grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setMarginPct(pct)}
                className="rounded border border-white/10 py-1 text-[10px] text-neutral-400 hover:bg-white/5 hover:text-white"
              >
                {pct}%
              </button>
            ))}
          </div>

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

          {/* TP / SL */}
          <div className="mb-3 space-y-2 rounded-md bg-black/30 p-2">
            <label className="flex items-center gap-2 text-[11px] text-neutral-400">
              <input
                type="checkbox"
                checked={tpEnabled}
                onChange={(e) => setTpEnabled(e.target.checked)}
                className="accent-lime-400"
              />
              Take Profit
              {tpEnabled && (
                <input
                  value={tp}
                  onChange={(e) => setTp(e.target.value)}
                  inputMode="decimal"
                  placeholder="price"
                  className="ml-auto w-24 rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-[11px] text-white outline-none focus:border-lime-400/50"
                />
              )}
            </label>
            <label className="flex items-center gap-2 text-[11px] text-neutral-400">
              <input
                type="checkbox"
                checked={slEnabled}
                onChange={(e) => setSlEnabled(e.target.checked)}
                className="accent-red-500"
              />
              Stop Loss
              {slEnabled && (
                <input
                  value={sl}
                  onChange={(e) => setSl(e.target.value)}
                  inputMode="decimal"
                  placeholder="price"
                  className="ml-auto w-24 rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-[11px] text-white outline-none focus:border-red-500/50"
                />
              )}
            </label>
          </div>

          <div className="mb-3 space-y-1 rounded-md bg-black/30 p-2 text-[11px]">
            <Row label="Notional" value={`$${fmtUsd(notional)}`} />
            <Row
              label={orderType === "limit" ? "Limit price" : "Entry (mark)"}
              value={`$${fmtUsd(entryPrice)}`}
            />
            <Row
              label="Est. liq. price"
              value={previewLiq != null ? fmtUsd(previewLiq) : "—"}
              tone="warn"
            />
            <Row
              label="Fees (0.05%)"
              value={`$${fmtUsd(notional * 0.0005)}`}
            />
          </div>

          <button
            onClick={open}
            disabled={marginNum <= 0 || marginNum > balance}
            className={`w-full rounded-md py-2.5 text-sm font-bold disabled:opacity-40 ${
              side === "long"
                ? "bg-lime-400 text-black hover:bg-lime-300"
                : "bg-red-500 text-white hover:bg-red-400"
            }`}
          >
            {orderType === "limit" ? "Place Limit " : ""}
            {side === "long" ? "Long" : "Short"} {market.label}
          </button>
          {!isConnected && (
            <p className="mt-2 text-center text-[10px] text-neutral-600">
              Demo mode — connect a wallet on Robinhood Chain Testnet for the
              on-chain flow (contracts coming soon).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div>
      <div
        className={`font-mono text-xs ${
          tone === "up"
            ? "text-lime-300"
            : tone === "down"
              ? "text-red-400"
              : "text-neutral-200"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] text-neutral-500">{label}</div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn";
}) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span
        className={`font-mono ${tone === "warn" ? "text-amber-400" : "text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}
