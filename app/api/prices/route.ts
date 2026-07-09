import { NextResponse } from "next/server";

const SYMBOLS = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "HOOD"] as const;

export interface Quote {
  price: number;
  prevClose: number;
  high: number;
  low: number;
  volume: number;
}

async function fetchQuote(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 10 },
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return {
      price: meta.regularMarketPrice,
      prevClose: meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice,
      high: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      low: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      volume: meta.regularMarketVolume ?? 0,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const entries = await Promise.all(
    SYMBOLS.map(async (s) => [s, await fetchQuote(s)] as const),
  );
  const out: Record<string, Quote> = {};
  for (const [s, q] of entries) if (q) out[s] = q;
  return NextResponse.json(out, {
    headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=30" },
  });
}
