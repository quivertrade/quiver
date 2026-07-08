export type MarketKey =
  | "AAPL"
  | "TSLA"
  | "NVDA"
  | "MSFT"
  | "AMZN"
  | "HOOD";

export interface Market {
  key: MarketKey;
  label: string;
  name: string;
  basePrice: number;
  volatility: number; // per-tick stddev, fraction of price
  color: string;
}

export const MARKETS: Market[] = [
  { key: "AAPL", label: "AAPL-PERP", name: "Apple Inc.", basePrice: 227.4, volatility: 0.0009, color: "#8e8e93" },
  { key: "TSLA", label: "TSLA-PERP", name: "Tesla Inc.", basePrice: 312.8, volatility: 0.0022, color: "#e82127" },
  { key: "NVDA", label: "NVDA-PERP", name: "NVIDIA Corp.", basePrice: 158.6, volatility: 0.0018, color: "#76b900" },
  { key: "MSFT", label: "MSFT-PERP", name: "Microsoft Corp.", basePrice: 498.1, volatility: 0.0008, color: "#00a4ef" },
  { key: "AMZN", label: "AMZN-PERP", name: "Amazon.com Inc.", basePrice: 223.5, volatility: 0.0012, color: "#ff9900" },
  { key: "HOOD", label: "HOOD-PERP", name: "Robinhood Markets", basePrice: 94.2, volatility: 0.0028, color: "#ccff00" },
];

export function marketByKey(key: MarketKey): Market {
  return MARKETS.find((m) => m.key === key)!;
}

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

/** Deterministic-ish random walk seeded per market for the demo vAMM. */
export function genCandles(m: Market, n = 60): Candle[] {
  let seed = m.key.charCodeAt(0) * 7919 + m.key.charCodeAt(1) * 104729;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const out: Candle[] = [];
  let px = m.basePrice * (0.97 + rand() * 0.02);
  for (let i = 0; i < n; i++) {
    const o = px;
    const drift = (rand() - 0.5) * 2 * m.volatility * 8 * px;
    const c = o + drift;
    const h = Math.max(o, c) + rand() * m.volatility * 4 * px;
    const l = Math.min(o, c) - rand() * m.volatility * 4 * px;
    out.push({ o, h, l, c });
    px = c;
  }
  return out;
}

export interface Position {
  id: number;
  market: MarketKey;
  side: "long" | "short";
  size: number; // notional USD
  margin: number; // USD
  leverage: number;
  entry: number;
  tp?: number; // take-profit price
  sl?: number; // stop-loss price
}

export function pnl(p: Position, mark: number): number {
  const qty = p.size / p.entry;
  const diff = mark - p.entry;
  return (p.side === "long" ? 1 : -1) * qty * diff;
}

export function pnlPct(p: Position, mark: number): number {
  return (pnl(p, mark) / p.margin) * 100;
}

export function liqPrice(p: Position): number {
  // maintenance margin 6.25%
  const mm = 0.0625;
  const frac = (p.margin / p.size - mm) * p.entry;
  return p.side === "long" ? p.entry - frac : p.entry + frac;
}

export interface DayStats {
  changePct: number;
  high: number;
  low: number;
  volume: number; // USD
  open: number;
}

/** Rolling 24h stats derived from the demo candles + live mark. */
export function dayStats(m: Market, mark: number): DayStats {
  const candles = genCandles(m);
  const window = candles.slice(-24);
  const open = window[0].o;
  const high = Math.max(mark, ...window.map((c) => c.h));
  const low = Math.min(mark, ...window.map((c) => c.l));
  const changePct = ((mark - open) / open) * 100;
  // deterministic pseudo-volume scaled by price + volatility
  const seed = m.key.charCodeAt(0) + m.key.charCodeAt(1);
  const volume = (2 + (seed % 7)) * 1_000_000 + m.volatility * 5e8;
  return { changePct, high, low, volume, open };
}

/** Demo funding rate (per 8h), small and side-dependent on drift. */
export function fundingRate(m: Market, mark: number): number {
  const { changePct } = dayStats(m, mark);
  return Math.max(-0.05, Math.min(0.05, changePct * 0.004));
}

export interface Level {
  price: number;
  size: number;
  total: number;
}

/** Synthetic order book around the mark price. */
export function orderBook(mark: number, rows = 8): { bids: Level[]; asks: Level[] } {
  const step = mark * 0.0005;
  const bids: Level[] = [];
  const asks: Level[] = [];
  let bt = 0;
  let at = 0;
  for (let i = 1; i <= rows; i++) {
    const bsize = Math.round(20 + Math.random() * 400);
    const asize = Math.round(20 + Math.random() * 400);
    bt += bsize;
    at += asize;
    bids.push({ price: mark - step * i, size: bsize, total: bt });
    asks.push({ price: mark + step * i, size: asize, total: at });
  }
  return { bids, asks };
}

export interface Trade {
  price: number;
  size: number;
  side: "buy" | "sell";
  t: number;
}

export function genTrade(mark: number): Trade {
  const side: "buy" | "sell" = Math.random() > 0.5 ? "buy" : "sell";
  const price = mark * (1 + (Math.random() - 0.5) * 0.0006);
  return { price, size: Math.round(5 + Math.random() * 300), side, t: Date.now() };
}

export function fmtUsd(x: number, digits = 2): string {
  return x.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtCompact(x: number): string {
  return x.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
}
