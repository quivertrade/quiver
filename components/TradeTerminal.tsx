"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { OnchainTrade } from "@/components/OnchainTrade";
import {
  MARKETS,
  TIMEFRAMES,
  type MarketKey,
  type Position,
  type Order,
  type Timeframe,
  type Trade,
  type ClosedTrade,
  type PriceAlert,
  pointsFor,
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
import { sharePnlCard } from "@/lib/shareCard";
import { syncPoints } from "@/lib/leaderboard";
import { Chart } from "./Chart";
import type { Candle } from "@/lib/markets";

interface Quote {
  price: number;
  prevClose: number;
  high: number;
  low: number;
  volume: number;
}

const MAX_LEV = 20;
const STORAGE_KEY = "quiver-demo-v1";
type OrderType = "market" | "limit";
type Tab = "positions" | "orders" | "history" | "book" | "trades";
type Toast = { id: number; kind: "ok" | "warn" | "info"; msg: string };

export function TradeTerminal({ initialMarket }: { initialMarket?: MarketKey }) {
  const { isConnected } = useAccount();
  const [selected, setSelected] = useState<MarketKey>(initialMarket ?? "TSLA");
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [balance, setBalance] = useState(10_000);
  const [history, setHistory] = useState<ClosedTrade[]>([]);
  const [points, setPoints] = useState(0);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertPrice, setAlertPrice] = useState("");
  const [bankModal, setBankModal] = useState<"deposit" | "withdraw" | null>(
    null,
  );
  const [bankAmount, setBankAmount] = useState("1000");
  const [tf, setTf] = useState<Timeframe>("15m");
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("positions");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [, setTick] = useState(0);

  const [marks, setMarks] = useState<Record<MarketKey, number>>(() =>
    Object.fromEntries(
      MARKETS.map((m) => [m.key, genCandles(m).at(-1)!.c]),
    ) as Record<MarketKey, number>,
  );
  const [quotes, setQuotes] = useState<Partial<Record<MarketKey, Quote>>>({});
  const [liveCandles, setLiveCandles] = useState<Candle[] | null>(null);

  const toast = useCallback((kind: Toast["kind"], msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  // persist demo account across reloads
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as {
          balance?: number;
          positions?: Position[];
          orders?: Order[];
          history?: ClosedTrade[];
          points?: number;
          alerts?: PriceAlert[];
        };
        if (typeof s.balance === "number") setBalance(s.balance);
        if (Array.isArray(s.positions)) setPositions(s.positions);
        if (Array.isArray(s.orders)) setOrders(s.orders);
        if (Array.isArray(s.history)) setHistory(s.history);
        if (typeof s.points === "number") setPoints(s.points);
        if (Array.isArray(s.alerts)) setAlerts(s.alerts);
      }
    } catch {
      // corrupted state — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ balance, positions, orders, history, points, alerts }),
    );
  }, [hydrated, balance, positions, orders, history, points, alerts]);

  // keep latest positions/orders in refs so the interval can act on them
  const posRef = useRef(positions);
  posRef.current = positions;
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const closeInternal = useCallback(
    (p: Position, mk: number, reason?: string) => {
      const realized = pnl(p, mk);
      setBalance((b) => b + p.margin + realized);
      setPositions((ps) => ps.filter((x) => x.id !== p.id));
      setHistory((hs) =>
        [
          {
            id: Date.now() + Math.random(),
            market: p.market,
            side: p.side,
            size: p.size,
            leverage: p.leverage,
            entry: p.entry,
            exit: mk,
            pnl: realized,
            reason: reason ?? "Closed",
            t: Date.now(),
          },
          ...hs,
        ].slice(0, 100),
      );
      setPoints((pt) => pt + pointsFor(p.size, realized));
      if (reason) {
        const v = realized;
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
          const jitter =
            (Math.random() - 0.5) * 0.5 * m.volatility * prev[m.key];
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
        // price alerts
        for (const a of alertsRef.current) {
          const mk = next[a.market];
          const hit = a.dir === "above" ? mk >= a.price : mk <= a.price;
          if (hit) {
            setAlerts((as) => as.filter((x) => x.id !== a.id));
            toast(
              "info",
              `Alert: ${marketByKey(a.market).label} crossed ${fmtUsd(a.price)}`,
            );
          }
        }
        // fill resting limit orders
        for (const o of ordersRef.current) {
          const mk = next[o.market];
          const filled = o.side === "long" ? mk <= o.price : mk >= o.price;
          if (filled) {
            setOrders((os) => os.filter((x) => x.id !== o.id));
            setPositions((ps) => [
              ...ps,
              {
                id: o.id,
                market: o.market,
                side: o.side,
                size: o.margin * o.leverage,
                margin: o.margin,
                leverage: o.leverage,
                entry: o.price,
                tp: o.tp,
                sl: o.sl,
              },
            ]);
            toast(
              "ok",
              `Limit filled ${o.side.toUpperCase()} ${marketByKey(o.market).label} @ ${fmtUsd(o.price)}`,
            );
          }
        }
        return next;
      });
      setTrades((prev) => [genTrade(marksRef.current[selectedRef.current]), ...prev].slice(0, 30));
      setTick((t) => t + 1);
    }, 1500);
    return () => clearInterval(id);
  }, [closeInternal, toast]);

  // push points to the shared leaderboard (debounced)
  useEffect(() => {
    if (!hydrated) return;
    const realized = history.reduce((s, h) => s + h.pnl, 0);
    const id = setTimeout(() => syncPoints(points, realized), 2000);
    return () => clearTimeout(id);
  }, [hydrated, points, history]);

  // real market prices from the price feed
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/prices");
        if (!res.ok) return;
        const data = (await res.json()) as Partial<Record<MarketKey, Quote>>;
        if (cancelled || !Object.keys(data).length) return;
        setQuotes(data);
        setMarks((prev) => {
          const next = { ...prev };
          for (const m of MARKETS) {
            const q = data[m.key];
            if (q?.price) next[m.key] = q.price;
          }
          return next;
        });
      } catch {
        // feed unavailable — keep demo walk
      }
    };
    load();
    const id = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // real candles for the selected market / timeframe
  useEffect(() => {
    let cancelled = false;
    setLiveCandles(null);
    (async () => {
      try {
        const res = await fetch(`/api/candles?symbol=${selected}&tf=${tf}`);
        if (!res.ok) return;
        const data = (await res.json()) as Candle[];
        if (!cancelled && Array.isArray(data) && data.length > 10)
          setLiveCandles(data);
      } catch {
        // fall back to generated candles
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, tf]);

  // refs to read fresh values inside interval
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const market = marketByKey(selected);
  const genFallback = useMemo(() => genCandles(market, 60, tf), [market, tf]);
  const candles = liveCandles ?? genFallback;
  const mark = marks[selected];
  const q = quotes[selected];
  const stats = q
    ? {
        changePct: ((mark - q.prevClose) / q.prevClose) * 100,
        high: Math.max(q.high, mark),
        low: Math.min(q.low, mark),
        volume: q.volume * mark,
        open: q.prevClose,
      }
    : dayStats(market, mark);
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

  const cancelOrder = (o: Order) => {
    setOrders((os) => os.filter((x) => x.id !== o.id));
    setBalance((b) => b + o.margin);
    toast("info", `Cancelled limit ${marketByKey(o.market).label}`);
  };

  const resetAccount = () => {
    setPositions([]);
    setOrders([]);
    setHistory([]);
    setAlerts([]);
    setPoints(0);
    setBalance(10_000);
    toast("ok", "Demo account reset — $10,000.00 tUSDC");
  };

  const bankSubmit = () => {
    const amt = Number(bankAmount);
    if (!(amt > 0)) return toast("warn", "Enter an amount");
    if (bankModal === "deposit") {
      setBalance((b) => b + amt);
      toast("ok", `Deposited $${fmtUsd(amt)} tUSDC (testnet faucet)`);
    } else {
      if (amt > balance) return toast("warn", "Insufficient free balance");
      setBalance((b) => b - amt);
      toast("ok", `Withdrew $${fmtUsd(amt)} tUSDC`);
    }
    setBankModal(null);
  };

  const addAlert = () => {
    const px = Number(alertPrice);
    if (!(px > 0)) return toast("warn", "Enter an alert price");
    setAlerts((as) => [
      ...as,
      {
        id: Date.now(),
        market: selected,
        price: px,
        dir: px >= mark ? "above" : "below",
      },
    ]);
    setAlertPrice("");
    toast("info", `Alert set: ${market.label} ${px >= mark ? "≥" : "≤"} ${fmtUsd(px)}`);
  };

  const open = () => {
    if (marginNum <= 0) return toast("warn", "Enter a margin amount");
    if (marginNum > balance) return toast("warn", "Insufficient balance");
    const tpNum = tpEnabled ? Number(tp) : undefined;
    const slNum = slEnabled ? Number(sl) : undefined;
    if (orderType === "limit") {
      const lp = Number(limitPrice);
      if (!(lp > 0)) return toast("warn", "Enter a limit price");
      const marketable = side === "long" ? mark <= lp : mark >= lp;
      if (!marketable) {
        setOrders((os) => [
          ...os,
          {
            id: Date.now(),
            market: selected,
            side,
            price: lp,
            margin: marginNum,
            leverage,
            tp: tpNum && tpNum > 0 ? tpNum : undefined,
            sl: slNum && slNum > 0 ? slNum : undefined,
          },
        ]);
        setBalance((b) => b - marginNum);
        setTab("orders");
        toast(
          "info",
          `Limit ${side.toUpperCase()} ${market.label} placed @ ${fmtUsd(lp)}`,
        );
        return;
      }
    }
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
    setPoints((pt) => pt + pointsFor(notional));
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
    setHistory((hs) =>
      [
        {
          id: Date.now() + Math.random(),
          market: p.market,
          side: p.side,
          size: p.size / 2,
          leverage: p.leverage,
          entry: p.entry,
          exit: mk,
          pnl: realized,
          reason: "Partial close",
          t: Date.now(),
        },
        ...hs,
      ].slice(0, 100),
    );
    setPoints((pt) => pt + pointsFor(p.size / 2, realized));
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
            const mq = quotes[m.key];
            const chg = mq
              ? ((marks[m.key] - mq.prevClose) / mq.prevClose) * 100
              : dayStats(m, marks[m.key]).changePct;
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
            <div className="ml-auto flex gap-1">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTf(t)}
                  className={`rounded px-2 py-1 font-mono text-[10px] ${
                    tf === t
                      ? "bg-lime-400/15 text-lime-300"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56 sm:h-64">
            <Chart candles={candles} mark={mark} />
          </div>
        </div>

        {/* tabbed panel */}
        <div className="rounded-lg border border-white/10 bg-[#110e08]">
          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-white/10 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider">
            {(
              [
                ["positions", `Positions (${positions.length})`],
                ["orders", `Orders (${orders.length})`],
                ["history", `History (${history.length})`],
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

          {tab === "orders" &&
            (orders.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-neutral-600">
                No open orders. Place a limit order from the order panel.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase text-neutral-600">
                    <tr>
                      <th className="px-3 py-2">Market</th>
                      <th className="px-2 py-2">Side</th>
                      <th className="px-2 py-2">Limit</th>
                      <th className="px-2 py-2">Mark</th>
                      <th className="px-2 py-2">Size</th>
                      <th className="px-2 py-2">TP / SL</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-white/5">
                        <td className="px-3 py-2 text-white">
                          {marketByKey(o.market).label}
                        </td>
                        <td
                          className={`px-2 py-2 ${o.side === "long" ? "text-lime-300" : "text-red-400"}`}
                        >
                          {o.side.toUpperCase()} {o.leverage}x
                        </td>
                        <td className="px-2 py-2 text-neutral-300">
                          {fmtUsd(o.price)}
                        </td>
                        <td className="px-2 py-2 text-neutral-300">
                          {fmtUsd(marks[o.market])}
                        </td>
                        <td className="px-2 py-2 text-neutral-300">
                          ${fmtUsd(o.margin * o.leverage, 0)}
                        </td>
                        <td className="px-2 py-2 text-neutral-400">
                          {o.tp ? fmtUsd(o.tp) : "—"} /{" "}
                          {o.sl ? fmtUsd(o.sl) : "—"}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => cancelOrder(o)}
                            className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] text-neutral-300 hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === "history" &&
            (history.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-neutral-600">
                No closed trades yet.
              </p>
            ) : (
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase text-neutral-600">
                    <tr>
                      <th className="px-3 py-2">Market</th>
                      <th className="px-2 py-2">Side</th>
                      <th className="px-2 py-2">Size</th>
                      <th className="px-2 py-2">Entry</th>
                      <th className="px-2 py-2">Exit</th>
                      <th className="px-2 py-2">PnL</th>
                      <th className="px-2 py-2">Reason</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {history.map((tr) => (
                      <tr key={tr.id} className="border-t border-white/5">
                        <td className="px-3 py-2 text-white">
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
                          {fmtUsd(tr.entry)}
                        </td>
                        <td className="px-2 py-2 text-neutral-300">
                          {fmtUsd(tr.exit)}
                        </td>
                        <td
                          className={`px-2 py-2 ${tr.pnl >= 0 ? "text-lime-300" : "text-red-400"}`}
                        >
                          {tr.pnl >= 0 ? "+" : ""}
                          {fmtUsd(tr.pnl)}
                        </td>
                        <td className="px-2 py-2 text-neutral-500">
                          {tr.reason}
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
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-neutral-600">
              Demo account
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setBankModal("deposit")}
                className="rounded border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-[10px] text-lime-300 hover:bg-lime-400/20"
              >
                Deposit
              </button>
              <button
                onClick={() => setBankModal("withdraw")}
                className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-neutral-400 hover:bg-white/5 hover:text-white"
              >
                Withdraw
              </button>
              <button
                onClick={resetAccount}
                className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-neutral-400 hover:bg-white/5 hover:text-white"
              >
                Reset
              </button>
            </div>
          </div>
          {bankModal && (
            <div className="mb-3 rounded-md border border-white/10 bg-black/40 p-2">
              <label className="mb-1 block text-[11px] capitalize text-neutral-400">
                {bankModal} tUSDC {bankModal === "deposit" && "(testnet faucet)"}
              </label>
              <div className="flex gap-1">
                <input
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-lime-400/50"
                />
                <button
                  onClick={bankSubmit}
                  className="rounded-md bg-lime-400 px-3 text-[11px] font-bold text-black hover:bg-lime-300"
                >
                  OK
                </button>
                <button
                  onClick={() => setBankModal(null)}
                  className="rounded-md border border-white/10 px-2 text-[11px] text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          <div className="mb-3 space-y-1.5 rounded-md bg-black/30 p-2.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-500">Equity</span>
              <span className="font-mono text-white">${fmtUsd(equity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Free balance</span>
              <span className="font-mono text-white">${fmtUsd(balance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Margin used</span>
              <span className="font-mono text-white">${fmtUsd(usedMargin)}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-1.5">
              <a
                href="/leaderboard"
                className="text-neutral-500 hover:text-lime-300"
              >
                Points ↗
              </a>
              <span className="font-mono text-lime-300">
                {fmtUsd(points, 0)}
              </span>
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
              Demo mode — connect a wallet on Robinhood Chain Testnet to trade
              on-chain via the vAMM contract.
            </p>
          )}
        </div>

        {/* On-chain trading (live vAMM contracts on Robinhood testnet) */}
        <OnchainTrade market={selected} onToast={toast} />

        {/* Price alerts */}
        <div className="rounded-lg border border-white/10 bg-[#110e08] p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-neutral-600">
            Price alerts · {market.label}
          </div>
          <div className="mb-2 flex gap-1">
            <input
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              inputMode="decimal"
              placeholder={fmtUsd(mark)}
              className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-lime-400/50"
            />
            <button
              onClick={addAlert}
              className="rounded-md border border-lime-400/30 bg-lime-400/10 px-3 text-[11px] font-semibold text-lime-300 hover:bg-lime-400/20"
            >
              Set
            </button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-[10px] text-neutral-600">
              No active alerts. You get a notification when price crosses.
            </p>
          ) : (
            <ul className="space-y-1">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded bg-black/30 px-2 py-1 font-mono text-[11px]"
                >
                  <span className="text-white">
                    {marketByKey(a.market).label}{" "}
                    <span className="text-neutral-500">
                      {a.dir === "above" ? "≥" : "≤"}
                    </span>{" "}
                    {fmtUsd(a.price)}
                  </span>
                  <button
                    onClick={() =>
                      setAlerts((as) => as.filter((x) => x.id !== a.id))
                    }
                    className="text-neutral-500 hover:text-white"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
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
