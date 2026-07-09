"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { robinhoodChainTestnet } from "@/lib/chain";

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [hasWallet, setHasWallet] = useState(true);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setHasWallet(typeof window !== "undefined" && !!window.ethereum);
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

  if (!hasWallet) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-lime-400/40 bg-lime-400/10 px-4 py-1.5 text-xs font-semibold text-lime-300 hover:bg-lime-400/20"
      >
        Install a Wallet
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="rounded-full bg-lime-400 px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
      {showError && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-red-500/40 bg-black px-3 py-2 text-[11px] text-red-300 shadow-lg">
          {error?.message.split(".")[0] ?? "Connection failed"}. Approve the
          request in your wallet and try again.
        </div>
      )}
    </div>
  );
}
