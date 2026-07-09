export const TEST_USDC_ADDRESS =
  "0xafe78687b234a1fb2b8c42c3b9fdfd1c0940c770" as const;
export const QUIVER_VAULT_ADDRESS =
  "0x4ff905a4649478057edb97a421e58c5180a29e35" as const;
export const QUIVER_PERP_ADDRESS =
  "0xa45135a54d18b850aa248fb7078df10089cb2ad0" as const;

export const TEST_USDC_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "lastFaucet",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "faucet",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const QUIVER_PERP_ABI = [
  {
    type: "function",
    name: "markPrice",
    stateMutability: "view",
    inputs: [{ name: "symbol", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "positions",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "bytes32" },
    ],
    outputs: [
      { name: "size", type: "uint256" },
      { name: "margin", type: "uint256" },
      { name: "openNotional", type: "uint256" },
      { name: "isLong", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "pnlOf",
    stateMutability: "view",
    inputs: [
      { name: "trader", type: "address" },
      { name: "symbol", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "int256" }],
  },
  {
    type: "function",
    name: "openPosition",
    stateMutability: "nonpayable",
    inputs: [
      { name: "symbol", type: "bytes32" },
      { name: "isLong", type: "bool" },
      { name: "margin", type: "uint256" },
      { name: "leverage", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "closePosition",
    stateMutability: "nonpayable",
    inputs: [{ name: "symbol", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setIndexPrices",
    stateMutability: "nonpayable",
    inputs: [
      { name: "symbols", type: "bytes32[]" },
      { name: "prices", type: "uint256[]" },
    ],
    outputs: [],
  },
] as const;

export const QUIVER_VAULT_ABI = [
  {
    type: "function",
    name: "balances",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;
