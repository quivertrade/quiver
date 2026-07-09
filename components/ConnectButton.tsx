"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  type Connector,
} from "wagmi";
import { robinhoodChainTestnet } from "@/lib/chain";

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

const WALLET_META: Record<string, { label: string; hint: string }> = {
  injected: { label: "Browser Wallet", hint: "MetaMask, Rabby, Brave…" },
  walletConnect: { label: "WalletConnect", hint: "Scan QR from any mobile wallet" },
  coinbaseWalletSDK: { label: "Coinbase Wallet", hint: "Coinbase app or extension" },
};

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [hasInjected, setHasInjected] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setHasInjected(typeof window !== "undefined" && !!window.ethereum);
  }, []);

  useEffect(() => {
    if (!error) return;
    setShowError(true);
    const t = setTimeout(() => setShowError(false), 4000);
    return () => clearTimeout(t);
  }, [error]);

  // auto-switch to Robinhood Chain Testnet after connecting
  useEffect(() => {
    if (isConnected && chainId !== robinhoodChainTestnet.id) {
      switchChain({ chainId: robinhoodChainTestnet.id });
    }
  }, [isConnected, chainId, switchChain]);

  useEffect(() => {
    if (isConnected) setOpen(false);
  }, [isConnected]);

  const pick = (c: Connector) => {
    connect({ connector: c });
  };

  if (isConnected && address) {
    const wrongChain = chainId !== robinhoodChainTestnet.id;
    return (
      <div className="flex items-center gap-2">
        {wrongChain && (
          <button
            onClick={() => switchChain({ chainId: robinhoodChainTestnet.id })}
            disabled={switching}
            className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {switching ? "Switching…" : "Switch to Robinhood Testnet"}
          </button>
        )}
        <button
          onClick={() => disconnect()}
          className="rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1.5 font-mono text-xs text-lime-300 hover:bg-lime-400/20"
          title="Disconnect"
        >
          {address.slice(0, 6)}…{address.slice(-4)}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="rounded-full bg-lime-400 px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-xl border border-white/10 bg-[#110e08] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                Connect a wallet
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {connectors.map((c) => {
                const meta = WALLET_META[c.id] ?? {
                  label: c.name,
                  hint: "",
                };
                const disabled =
                  (c.id === "injected" && !hasInjected) || isPending;
                return (
                  <button
                    key={c.uid}
                    onClick={() => pick(c)}
                    disabled={disabled}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-left hover:border-lime-400/40 hover:bg-lime-400/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>
                      <span className="block text-xs font-semibold text-white">
                        {meta.label}
                      </span>
                      {meta.hint && (
                        <span className="block text-[10px] text-neutral-500">
                          {c.id === "injected" && !hasInjected
                            ? "No wallet extension detected"
                            : meta.hint}
                        </span>
                      )}
                    </span>
                    <span className="text-lime-300">→</span>
                  </button>
                );
              })}
            </div>
            {showError && (
              <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                {error?.message.split(".")[0] ?? "Connection failed"}. Approve
                the request in your wallet and try again.
              </p>
            )}
            <p className="mt-3 text-center text-[10px] text-neutral-600">
              Connects to Robinhood Chain Testnet · 46630
            </p>
          </div>
        </div>
      )}
    </>
  );
}
