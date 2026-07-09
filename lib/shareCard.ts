import { marketByKey, fmtUsd, type ClosedTrade } from "./markets";

/** Renders a shareable PnL card to a PNG and triggers a download,
 *  then opens the X share intent pre-filled with the result. */
export function sharePnlCard(t: ClosedTrade) {
  const w = 900;
  const h = 470;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const market = marketByKey(t.market);
  const pct = (t.pnl / (t.size / t.leverage)) * 100;
  const win = t.pnl >= 0;
  const accent = win ? "#ccff00" : "#f87171";

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w / 2, h, 40, w / 2, h, w * 0.75);
  glow.addColorStop(0, win ? "rgba(204,255,0,0.18)" : "rgba(248,113,113,0.15)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  ctx.fillStyle = "#ccff00";
  ctx.font = "bold 34px Georgia, serif";
  ctx.fillText("Quiver", 48, 70);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "16px ui-monospace, monospace";
  ctx.fillText("quiver-trade.com · Robinhood Chain Testnet", 48, 100);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px ui-monospace, monospace";
  ctx.fillText(market.label, 48, 170);
  ctx.fillStyle = t.side === "long" ? "#ccff00" : "#f87171";
  ctx.font = "bold 22px ui-monospace, monospace";
  ctx.fillText(`${t.side.toUpperCase()} ${t.leverage}x`, 48, 205);

  ctx.fillStyle = accent;
  ctx.font = "bold 84px ui-monospace, monospace";
  ctx.fillText(`${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, 48, 300);
  ctx.font = "bold 30px ui-monospace, monospace";
  ctx.fillText(`${t.pnl >= 0 ? "+" : ""}$${fmtUsd(t.pnl)}`, 48, 345);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "17px ui-monospace, monospace";
  ctx.fillText(`Entry  $${fmtUsd(t.entry)}`, 48, 400);
  ctx.fillText(`Exit   $${fmtUsd(t.exit)}`, 300, 400);
  ctx.fillText(`Size   $${fmtUsd(t.size, 0)}`, 552, 400);

  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `quiver-${market.label}-pnl.png`;
  a.click();

  const text = `${win ? "Banked" : "Took"} ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% on ${market.label} (${t.side.toUpperCase()} ${t.leverage}x) on @_Quivertrade — perps on tokenized stocks, live on Robinhood Chain testnet`;
  window.open(
    `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://quiver-trade.com")}`,
    "_blank",
  );
}
