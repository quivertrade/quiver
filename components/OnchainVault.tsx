"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { robinhoodChainTestnet } from "@/lib/chain";
import {
  TEST_USDC_ABI,
  TEST_USDC_ADDRESS,
  QUIVER_VAULT_ABI,
  QUIVER_VAULT_ADDRESS,
} from "@/lib/contracts";
import { fmtUsd } from "@/lib/markets";

type Step = "idle" | "faucet" | "approve" | "deposit" | "withdraw";

export function OnchainVault({
  onToast,
}: {
  onToast: (kind: "ok" | "warn" | "info", msg: string) => void;
}) {
  const { address, isConnected, chainId } = useAccount();
  const [amount, setAmount] = useState("1000");
  const [step, setStep] = useState<Step>("idle");

  const chainOk = chainId === robinhoodChainTestnet.id;
  const enabled = isConnected && !!address && chainOk;

  const { data: walletBal, refetch: refetchWallet } = useReadContract({
    address: TEST_USDC_ADDRESS,
    abi: TEST_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: robinhoodChainTestnet.id,
    query: { enabled },
  });
  const { data: vaultBal, refetch: refetchVault } = useReadContract({
    address: QUIVER_VAULT_ADDRESS,
    abi: QUIVER_VAULT_ABI,
    functionName: "balances",
    args: address ? [address] : undefined,
    chainId: robinhoodChainTestnet.id,
    query: { enabled },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TEST_USDC_ADDRESS,
    abi: TEST_USDC_ABI,
    functionName: "allowance",
    args: address ? [address, QUIVER_VAULT_ADDRESS] : undefined,
    chainId: robinhoodChainTestnet.id,
    query: { enabled },
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
    refetchVault();
    refetchAllowance();
    if (step === "faucet") {
      onToast("ok", "Faucet: +10,000 tUSDC minted on-chain");
      setStep("idle");
    } else if (step === "approve") {
      const amt = parseUnits(amount || "0", 6);
      setStep("deposit");
      writeContract({
        address: QUIVER_VAULT_ADDRESS,
        abi: QUIVER_VAULT_ABI,
        functionName: "deposit",
        args: [amt],
        chainId: robinhoodChainTestnet.id,
      });
    } else if (step === "deposit") {
      onToast("ok", `Deposited ${amount} tUSDC to the vault on-chain`);
      setStep("idle");
    } else if (step === "withdraw") {
      onToast("ok", `Withdrew ${amount} tUSDC from the vault`);
      setStep("idle");
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txDone]);

  if (!isConnected) return null;

  const wallet = walletBal ?? BigInt(0);
  const vault = vaultBal ?? BigInt(0);
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

  const deposit = () => {
    const amt = parseUnits(amount || "0", 6);
    if (amt <= BigInt(0)) return onToast("warn", "Enter an amount");
    if (amt > wallet)
      return onToast("warn", "Not enough tUSDC in wallet — use the faucet");
    if ((allowance ?? BigInt(0)) >= amt) {
      setStep("deposit");
      writeContract({
        address: QUIVER_VAULT_ADDRESS,
        abi: QUIVER_VAULT_ABI,
        functionName: "deposit",
        args: [amt],
        chainId: robinhoodChainTestnet.id,
      });
    } else {
      setStep("approve");
      writeContract({
        address: TEST_USDC_ADDRESS,
        abi: TEST_USDC_ABI,
        functionName: "approve",
        args: [QUIVER_VAULT_ADDRESS, amt],
        chainId: robinhoodChainTestnet.id,
      });
    }
  };

  const withdraw = () => {
    const amt = parseUnits(amount || "0", 6);
    if (amt <= BigInt(0)) return onToast("warn", "Enter an amount");
    if (amt > vault) return onToast("warn", "Not enough vault balance");
    setStep("withdraw");
    writeContract({
      address: QUIVER_VAULT_ADDRESS,
      abi: QUIVER_VAULT_ABI,
      functionName: "withdraw",
      args: [amt],
      chainId: robinhoodChainTestnet.id,
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#110e08] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-neutral-600">
          On-chain vault · testnet
        </span>
        <a
          href={`https://explorer.testnet.chain.robinhood.com/address/${QUIVER_VAULT_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-neutral-500 hover:text-lime-300"
        >
          Contract ↗
        </a>
      </div>
      {!chainOk ? (
        <p className="py-2 text-[11px] text-amber-400">
          Switch to Robinhood Chain Testnet to use the on-chain vault.
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
              <span className="text-neutral-500">Vault balance</span>
              <span className="font-mono text-lime-300">
                ${fmtUsd(Number(formatUnits(vault, 6)))}
              </span>
            </div>
          </div>
          <div className="mb-2 flex gap-1">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-lime-400/50"
            />
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
              onClick={deposit}
              disabled={busy}
              className="rounded-md bg-lime-400 px-2 py-1.5 text-[11px] font-bold text-black hover:bg-lime-300 disabled:opacity-50"
            >
              {step === "approve"
                ? "Approving…"
                : step === "deposit"
                  ? "Depositing…"
                  : "Deposit"}
            </button>
            <button
              onClick={withdraw}
              disabled={busy}
              className="rounded-md border border-white/15 px-2 py-1.5 text-[11px] text-neutral-300 hover:bg-white/5 disabled:opacity-50"
            >
              {step === "withdraw" ? "Withdrawing…" : "Withdraw"}
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-600">
            Real transactions on Robinhood Chain Testnet. Faucet mints 10,000
            tUSDC per 24h. Trading engine still settles off-chain during the
            demo phase.
          </p>
        </>
      )}
    </div>
  );
}
