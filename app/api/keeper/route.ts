import { NextResponse } from "next/server";
import { get, put } from "@vercel/blob";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  stringToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { robinhoodChainTestnet } from "@/lib/chain";
import { QUIVER_PERP_ABI, QUIVER_PERP_ADDRESS } from "@/lib/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYMBOLS = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "HOOD"] as const;
const MIN_INTERVAL_MS = 60_000;
const STAMP_PATH = "keeper-last.json";

async function lastPush(): Promise<number> {
  try {
    const res = await get(STAMP_PATH, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return 0;
    const { t } = JSON.parse(await new Response(res.stream).text());
    return typeof t === "number" ? t : 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  const pk = process.env.KEEPER_PRIVATE_KEY;
  if (!pk) return NextResponse.json({ error: "keeper not configured" }, { status: 503 });

  const last = await lastPush();
  if (Date.now() - last < MIN_INTERVAL_MS) {
    return NextResponse.json({ ok: true, skipped: true, last });
  }
  await put(STAMP_PATH, JSON.stringify({ t: Date.now() }), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });

  const base =
    process.env.VERCEL_PROJECT_PRODUCTION_URL != null
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000";
  const res = await fetch(`${base}/api/prices`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "no prices" }, { status: 502 });
  const quotes = (await res.json()) as Record<string, { price: number }>;

  const symbols: `0x${string}`[] = [];
  const prices: bigint[] = [];
  for (const s of SYMBOLS) {
    const p = quotes[s]?.price;
    if (!p || p <= 0) continue;
    symbols.push(stringToHex(s, { size: 32 }));
    prices.push(parseUnits(p.toFixed(6), 6));
  }
  if (!symbols.length) return NextResponse.json({ error: "no prices" }, { status: 502 });

  const account = privateKeyToAccount(pk as `0x${string}`);
  const wallet = createWalletClient({
    account,
    chain: robinhoodChainTestnet,
    transport: http(),
  });
  const pub = createPublicClient({
    chain: robinhoodChainTestnet,
    transport: http(),
  });
  const hash = await wallet.writeContract({
    address: QUIVER_PERP_ADDRESS,
    abi: QUIVER_PERP_ABI,
    functionName: "setIndexPrices",
    args: [symbols, prices],
  });
  await pub.waitForTransactionReceipt({ hash });
  return NextResponse.json({ ok: true, tx: hash, pushed: symbols.length });
}
