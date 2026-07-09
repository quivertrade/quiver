import { NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOB_PATH = "leaderboard.json";

interface Entry {
  id: string;
  handle: string;
  points: number;
  pnl: number;
  t: number;
}

async function readEntries(): Promise<Entry[]> {
  try {
    const res = await get(BLOB_PATH, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return [];
    const text = await new Response(res.stream).text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? (data as Entry[]) : [];
  } catch {
    return [];
  }
}

async function writeEntries(entries: Entry[]) {
  await put(BLOB_PATH, JSON.stringify(entries), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function GET() {
  const entries = await readEntries();
  entries.sort((a, b) => b.points - a.points);
  return NextResponse.json(
    entries.slice(0, 100).map(({ handle, points, pnl }) => ({ handle, points, pnl })),
  );
}

export async function POST(req: Request) {
  let body: { id?: unknown; handle?: unknown; points?: unknown; pnl?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id.slice(0, 64) : "";
  const handle =
    typeof body.handle === "string"
      ? body.handle.trim().slice(0, 20).replace(/[^\w.\-…]/g, "")
      : "";
  const points = typeof body.points === "number" ? body.points : NaN;
  const pnl = typeof body.pnl === "number" ? body.pnl : 0;
  if (!id || !handle || !Number.isFinite(points) || points < 0 || points > 1e9) {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  const entries = await readEntries();
  const idx = entries.findIndex((e) => e.id === id);
  const entry: Entry = { id, handle, points: Math.round(points), pnl, t: Date.now() };
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  await writeEntries(entries.slice(0, 5000));
  return NextResponse.json({ ok: true });
}
