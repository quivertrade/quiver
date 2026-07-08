"use client";

import { useEffect, useRef } from "react";
import type { Candle } from "@/lib/markets";

export function Chart({ candles, mark }: { candles: Candle[]; mark?: number }) {
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

    const axis = 52; // right price axis width
    const plotW = w - axis;

    const values = candles.flatMap((c) => [c.h, c.l]);
    if (mark != null) values.push(mark);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo) * 0.08 || 1;
    const y = (v: number) => h - ((v - lo + pad) / (hi - lo + 2 * pad)) * h;
    const cw = plotW / candles.length;

    // gridlines + price labels
    ctx.font = "10px ui-monospace, monospace";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const gy = (h / 4) * i;
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(plotW, gy);
      ctx.stroke();
      const val = lo - pad + (hi - lo + 2 * pad) * (1 - i / 4);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillText(val.toFixed(2), plotW + 6, Math.min(h - 6, Math.max(6, gy)));
    }

    candles.forEach((c, i) => {
      const x = i * cw + cw / 2;
      const up = c.c >= c.o;
      ctx.strokeStyle = up ? "#ccff00" : "#f87171";
      ctx.fillStyle = up ? "#ccff00" : "#f87171";
      ctx.beginPath();
      ctx.moveTo(x, y(c.h));
      ctx.lineTo(x, y(c.l));
      ctx.stroke();
      const bodyTop = y(Math.max(c.o, c.c));
      const bodyH = Math.max(1, Math.abs(y(c.o) - y(c.c)));
      ctx.fillRect(x - cw * 0.3, bodyTop, cw * 0.6, bodyH);
    });

    // live mark price line
    if (mark != null) {
      const my = y(mark);
      ctx.strokeStyle = "rgba(204,255,0,0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, my);
      ctx.lineTo(plotW, my);
      ctx.stroke();
      ctx.setLineDash([]);
      // price tag
      ctx.fillStyle = "#ccff00";
      ctx.fillRect(plotW, my - 8, axis, 16);
      ctx.fillStyle = "#000000";
      ctx.fillText(mark.toFixed(2), plotW + 5, my);
    }
  }, [candles, mark]);

  return <canvas ref={ref} className="h-full w-full" />;
}
