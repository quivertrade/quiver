"use client";

import { useEffect, useRef } from "react";
import type { Candle } from "@/lib/markets";

export function Chart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const lo = Math.min(...candles.map((c) => c.l));
    const hi = Math.max(...candles.map((c) => c.h));
    const pad = (hi - lo) * 0.08;
    const y = (v: number) => h - ((v - lo + pad) / (hi - lo + 2 * pad)) * h;
    const cw = w / candles.length;

    // gridlines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / 5) * i);
      ctx.lineTo(w, (h / 5) * i);
      ctx.stroke();
    }

    candles.forEach((c, i) => {
      const x = i * cw + cw / 2;
      const up = c.c >= c.o;
      ctx.strokeStyle = up ? "#a3e635" : "#f87171";
      ctx.fillStyle = up ? "#a3e635" : "#f87171";
      ctx.beginPath();
      ctx.moveTo(x, y(c.h));
      ctx.lineTo(x, y(c.l));
      ctx.stroke();
      const bodyTop = y(Math.max(c.o, c.c));
      const bodyH = Math.max(1, Math.abs(y(c.o) - y(c.c)));
      ctx.fillRect(x - cw * 0.3, bodyTop, cw * 0.6, bodyH);
    });
  }, [candles]);

  return <canvas ref={ref} className="h-full w-full" />;
}
