# Introducing Quiver: 24/7 Perpetual Futures on Tokenized Stocks, Live on Robinhood Chain Testnet

Stock markets close at 4pm. They shut down on weekends and holidays. Shorting is gated behind brokers and borrow fees, and leverage is rationed out to a select few. Meanwhile, crypto never sleeps.

Quiver fixes this. Today we're announcing that **Quiver is live on Robinhood Chain testnet** — a fully on-chain perpetual futures exchange for tokenized stocks. Long or short AAPL, TSLA, NVDA, MSFT, AMZN and HOOD with up to 20x leverage, any time of day, any day of the week.

→ Trade now: https://quiver-trade.com

## Why perps on tokenized stocks?

Tokenized equities are going mainstream. Robinhood Chain — an Arbitrum Orbit L2 purpose-built for real-world assets — is bringing stocks on-chain. But spot tokens are only half the story. Real markets need derivatives: the ability to hedge, to short, to express leveraged views.

That's the layer Quiver is building. Where traditional markets give you 6.5 trading hours a day and no easy way to short, Quiver gives you:

- **24/7 markets** — trade nights, weekends, holidays
- **Long or short in one click** — no borrow, no locate, no broker approval
- **Up to 20x leverage** — capital efficient, with isolated margin per position
- **On-chain settlement** — every open, close and liquidation settles on Robinhood Chain

## How it works

Quiver uses a **virtual AMM (vAMM)** — the x·y=k bonding curve model pioneered for on-chain perps. Trades execute against the curve for instant liquidity and transparent, manipulation-resistant mark prices, without requiring counterparties on the other side of every trade.

An off-chain **keeper** continuously pushes real stock index prices on-chain, so mark prices stay anchored to real markets. Funding between mark and index keeps the vAMM honest.

Risk is managed with **isolated margin**: each position has its own collateral, and positions are liquidated when equity falls below 5% of notional — liquidators earn a reward for keeping the system solvent. Trading fee is a flat 0.10%.

Everything is verifiable on-chain. Contract addresses are published in our docs: https://quiver-trade.com/docs

## What's live today

- 6 markets: AAPL, TSLA, NVDA, MSFT, AMZN, HOOD
- Fully on-chain open / close / liquidate via the QuiverPerp vAMM contract
- Real index price feeds pushed on-chain by the keeper
- tUSDC testnet faucet — get funded and trading in seconds
- Portfolio page with PnL curve and trade history
- Points program and public leaderboard

## Points → $QVR

Quiver's testnet points program is running now. Every dollar of volume earns points, with a bonus for profitable trading. Points will convert into a **$QVR airdrop allocation at TGE**, ahead of the mainnet launch.

Check your rank: https://quiver-trade.com/leaderboard

## Get started in 60 seconds

1. Visit https://quiver-trade.com/trade and connect any EVM wallet (MetaMask, WalletConnect, Coinbase Wallet) — Quiver auto-adds Robinhood Chain testnet
2. Hit the faucet to mint testnet tUSDC
3. Pick a market, choose long or short, set margin and leverage, and trade

*Quiver is currently on testnet. No real funds are at risk; tokens have no monetary value.*

## Links

- Website: https://quiver-trade.com
- Docs: https://quiver-trade.com/docs
- Roadmap: https://quiver-trade.com/roadmap
- $QVR token: https://quiver-trade.com/token
- GitHub: https://github.com/quivertrade/quiver
- X: https://x.com/_Quivertrade

*Every market, one quiver.* 🏹
