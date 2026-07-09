"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, parseUnits, stringToHex } from "viem";
import { robinhoodChainTestnet } from "@/lib/chain";
import {
  TEST_USDC_ABI,
  TEST_USDC_ADDRESS,
  QUIVER_PERP_ABI,
  QUIVER_PERP_ADDRESS,
} from "@/lib/contracts";
import { fmtUsd, type MarketKey, marketByKey } from "@/lib/markets";

type Step = "idle" | "faucet" | "approve" | "open" | "close";

export function OnchainTrade({
  market,
  onToast,
}: {
  market: MarketKey;
  onToast: (kind: "ok" | "warn" | "info", msg: string) => void;
}) {
  const { address, isConnected, chainId } = useAccount();
  const [margin, setMargin] = useState("100");
  const [leverage, setLeverage] = useState(5);
  const [isLong, setIsLong] = useState(true);
  const [step, setStep] = useState<Step>("idle");

  const chainOk = chainId === robinhoodChainTestnet.id;
  const enabled = isConnected && !!address && chainOk;
  const symbol = stringToHex(market, { size: 32 });

  // freshen on-chain index prices (keeper is rate-limited server-side)
  useEffect(() => {
    if (!enabled) return;
    fetch("/api/keeper").catch(() => {});
    const id = setInterval(() => fetch("/api/keeper").catch(() => {}), 90_000);
    return () => clearInterval(id);
  }, [enabled]);

  const { data: walletBal, refetch: refetchWallet } = useReadContract({
    address: TEST_USDC_ADDRESS,
    abi: TEST_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: robinhoodChainTestnet.id,
    query: { enabled, refetchInterval: 15_000 },
  });
  const { data: markOnchain } = useReadContract({
    address: QUIVER_PERP_ADDRESS,
    abi: QUIVER_PERP_ABI,
    functionName: "markPrice",
    args: [symbol],
    chainId: robinhoodChainTestnet.id,
    query: { enabled, refetchInterval: 15_000 },
  });
  const { data: pos, refetch: refetchPos } = useReadContract({
    address: QUIVER_PERP_ADDRESS,
    abi: QUIVER_PERP_ABI,
    functionName: "positions",
    args: address ? [address, symbol] : undefined,
    chainId: robinhoodChainTestnet.id,
    query: { enabled, refetchInterval: 15_000 },
  });
  const hasPos = !!pos && pos[0] > BigInt(0);
  const { data: pnl } = useReadContract({
    address: QUIVER_PERP_ADDRESS,
    abi: QUIVER_PERP_ABI,
    functionName: "pnlOf",
    args: address ? [address, symbol] : undefined,
    chainId: robinhoodChainTestnet.id,
    query: { enabled: enabled && hasPos, refetchInterval: 15_000 },
  });

  const { writeContract, data: txHash, error: txError, reset } = useWriteContract();
  const { isSuccess: txDone } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: robinhoodChainTestnet.id,
  });

  useEffect(() => {
    if (!txError) return;
    onToast("warn", txError.message.split(".")[0].slice(0, 90));
    setStep("idle");
    reset();
  }, [txError, onToast, reset]);

  useEffect(() => {
    if (!txDone || step === "idle") return;
    refetchWallet();
    refetchPos();
    if (step === "faucet") {
      onToast("ok", "Faucet: +10,000 tUSDC minted on-chain");
      setStep("idle");
    } else if (step === "approve") {
      const m = parseUnits(margin || "0", 6);
      setStep("open");
      writeContract({
        address: QUIVER_PERP_ADDRESS,
        abi: QUIVER_PERP_ABI,
        functionName: "openPosition",
        args: [symbol, isLong, m, BigInt(leverage)],
        chainId: robinhoodChainTestnet.id,
      });
    } else if (step === "open") {
      onToast(
        "ok",
        `On-chain ${isLong ? "long" : "short"} ${market} opened (${leverage}x)`,
      );
      setStep("idle");
    } else if (step === "close") {
      onToast("ok", `On-chain ${market} position closed & settled`);
      setStep("idle");
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txDone]);

  if (!isConnected) return null;

  const wallet = walletBal ?? BigInt(0);
  const busy = step !== "idle";

  const faucet = () => {
    setStep("faucet");
    writeContract({
      address: TEST_USDC_ADDRESS,
      abi: TEST_USDC_ABI,
      functionName: "faucet",
      chainId: robinhoodChainTestnet.id,
    });
  };

  const open = () => {
    const m = parseUnits(margin || "0", 6);
    if (m < parseUnits("1", 6)) return onToast("warn", "Min margin 1 tUSDC");
    const fee = (m * BigInt(leverage) * BigInt(10)) / BigInt(10_000);
    if (m + fee > wallet)
      return onToast("warn", "Not enough tUSDC — use the faucet");
    if (hasPos)
      return onToast("warn", `Close your on-chain ${market} position first`);
    setStep("approve");
    writeContract({
      address: TEST_USDC_ADDRESS,
      abi: TEST_USDC_ABI,
      functionName: "approve",
      args: [QUIVER_PERP_ADDRESS, m + fee],
      chainId: robinhoodChainTestnet.id,
    });
  };

  const close = () => {
    setStep("close");
    writeContract({
      address: QUIVER_PERP_ADDRESS,
      abi: QUIVER_PERP_ABI,
      functionName: "closePosition",
      args: [symbol],
      chainId: robinhoodChainTestnet.id,
    });
  };

  const pnlNum = pnl != null ? Number(formatUnits(pnl, 6)) : 0;

  return (
    <div className="rounded-lg border border-lime-400/20 bg-[#110e08] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-lime-300/80">
          On-chain trading · {marketByKey(market).label}
        </span>
        <a
          href={`https://explorer.testnet.chain.robinhood.com/address/${QUIVER_PERP_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-neutral-500 hover:text-lime-300"
        >
          Contract ↗
        </a>
      </div>
      {!chainOk ? (
        <p className="py-2 text-[11px] text-amber-400">
          Switch to Robinhood Chain Testnet to trade on-chain.
        </p>
      ) : (
        <>
          <div className="mb-2 space-y-1.5 rounded-md bg-black/30 p-2.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-500">Wallet tUSDC</span>
              <span className="font-mono text-white">
                ${fmtUsd(Number(formatUnits(wallet, 6)))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">vAMM mark</span>
              <span className="font-mono text-white">
                {markOnchain != null
                  ? `$${fmtUsd(Number(formatUnits(markOnchain, 6)))}`
                  : "—"}
              </span>
            </div>
          </div>

          {hasPos && pos ? (
            <div className="mb-2 rounded-md border border-white/10 bg-black/30 p-2.5 text-[11px]">
              <div className="flex justify-between">
                <span className={pos[3] ? "text-lime-300" : "text-rose-400"}>
                  {pos[3] ? "LONG" : "SHORT"}{" "}
                  {(Number(pos[2]) / Number(pos[1])).toFixed(0)}x
                </span>
                <span className="font-mono text-neutral-400">
                  margin ${fmtUsd(Number(formatUnits(pos[1], 6)))}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-neutral-500">Unrealized PnL</span>
                <span
                  className={`font-mono ${pnlNum >= 0 ? "text-lime-300" : "text-rose-400"}`}
                >
                  {pnlNum >= 0 ? "+" : "−"}${fmtUsd(Math.abs(pnlNum))}
                </span>
              </div>
              <button
                onClick={close}
                disabled={busy}
                className="mt-2 w-full rounded-md border border-white/15 px-2 py-1.5 text-[11px] text-neutral-200 hover:bg-white/5 disabled:opacity-50"
              >
                {step === "close" ? "Closing…" : "Close position on-chain"}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2 grid grid-cols-2 gap-1">
                <button
                  onClick={() => setIsLong(true)}
                  className={`rounded-md px-2 py-1.5 text-[11px] font-semibold ${isLong ? "bg-lime-400 text-black" : "border border-white/10 text-neutral-400"}`}
                >
                  Long
                </button>
                <button
                  onClick={() => setIsLong(false)}
                  className={`rounded-md px-2 py-1.5 text-[11px] font-semibold ${!isLong ? "bg-rose-500 text-white" : "border border-white/10 text-neutral-400"}`}
                >
                  Short
                </button>
              </div>
              <div className="mb-2 flex items-center gap-1">
                <input
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-lime-400/50"
                />
                <select
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="rounded-md border border-white/10 bg-black/40 px-1.5 py-1.5 font-mono text-xs text-white outline-none"
                >
                  {[1, 2, 3, 5, 10, 15, 20].map((l) => (
                    <option key={l} value={l}>
                      {l}x
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={faucet}
                  disabled={busy}
                  className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1.5 text-[11px] font-semibold text-lime-300 hover:bg-lime-400/20 disabled:opacity-50"
                >
                  {step === "faucet" ? "Minting…" : "Faucet"}
                </button>
                <button
                  onClick={open}
                  disabled={busy}
                  className="col-span-2 rounded-md bg-lime-400 px-2 py-1.5 text-[11px] font-bold text-black hover:bg-lime-300 disabled:opacity-50"
                >
                  {step === "approve"
                    ? "Approving…"
                    : step === "open"
                      ? "Opening…"
                      : `Open ${isLong ? "long" : "short"} on-chain`}
                </button>
              </div>
            </>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-600">
            Real vAMM contract on Robinhood Chain Testnet — open, close and
            liquidation settle on-chain. Fee 0.10% of notional. Index prices
            pushed by a keeper.
          </p>
        </>
      )}
    </div>
  );
}
