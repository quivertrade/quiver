import { NextResponse } from "next/server";

const VALID = new Set(["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "HOOD"]);

const TF_PARAMS: Record<string, { interval: string; range: string; agg: number }> = {
  "5m": { interval: "5m", range: "1d", agg: 1 },
  "15m": { interval: "15m", range: "5d", agg: 1 },
  "1h": { interval: "60m", range: "1mo", agg: 1 },
  "4h": { interval: "60m", range: "3mo", agg: 4 },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol") ?? "";
  const tf = url.searchParams.get("tf") ?? "15m";
  if (!VALID.has(symbol) || !TF_PARAMS[tf]) {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  const { interval, range, agg } = TF_PARAMS[tf];
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 30 } },
    );
    if (!res.ok) throw new Error("upstream");
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const q = result?.indicators?.quote?.[0];
    if (!q) throw new Error("no data");
    const raw: { o: number; h: number; l: number; c: number }[] = [];
    for (let i = 0; i < q.open.length; i++) {
      if (
        q.open[i] == null ||
        q.high[i] == null ||
        q.low[i] == null ||
        q.close[i] == null
      )
        continue;
      raw.push({ o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i] });
    }
    let candles = raw;
    if (agg > 1) {
      candles = [];
      for (let i = 0; i < raw.length; i += agg) {
        const chunk = raw.slice(i, i + agg);
        candles.push({
          o: chunk[0].o,
          h: Math.max(...chunk.map((c) => c.h)),
          l: Math.min(...chunk.map((c) => c.l)),
          c: chunk[chunk.length - 1].c,
        });
      }
    }
    return NextResponse.json(candles.slice(-60), {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
