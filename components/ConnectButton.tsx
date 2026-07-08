"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { robinhoodChainTestnet } from "@/lib/chain";

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  if (isConnected && address) {
    const wrongChain = chainId !== robinhoodChainTestnet.id;
    return (
      <div className="flex items-center gap-2">
        {wrongChain && (
          <button
            onClick={() => switchChain({ chainId: robinhoodChainTestnet.id })}
            className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20"
          >
            Switch to Robinhood Testnet
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
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="rounded-full bg-lime-400 px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
    >
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
