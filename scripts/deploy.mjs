import fs from "node:fs";
import solc from "solc";
import {
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  stringToHex,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const chain = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com"] } },
});

const files = ["Quiver.sol", "QuiverPerp.sol"];
const input = {
  language: "Solidity",
  sources: Object.fromEntries(
    files.map((f) => [
      f,
      { content: fs.readFileSync(new URL(`../contracts/${f}`, import.meta.url), "utf8") },
    ]),
  ),
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};
const out = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (out.errors ?? []).filter((e) => e.severity === "error");
if (errors.length) {
  console.error(errors);
  process.exit(1);
}
const contracts = {
  TestUSDC: out.contracts["Quiver.sol"].TestUSDC,
  QuiverVault: out.contracts["Quiver.sol"].QuiverVault,
  QuiverPerp: out.contracts["QuiverPerp.sol"].QuiverPerp,
};

const { pk } = JSON.parse(fs.readFileSync(process.env.HOME + "/.quiver-deployer.json", "utf8"));
const account = privateKeyToAccount(pk);
const wallet = createWalletClient({ account, chain, transport: http() });
const pub = createPublicClient({ chain, transport: http() });

console.log("deployer:", account.address);
console.log("balance:", await pub.getBalance({ address: account.address }));

async function deploy(name, args = []) {
  const c = contracts[name];
  const hash = await wallet.deployContract({
    abi: c.abi,
    bytecode: "0x" + c.evm.bytecode.object,
    args,
  });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  console.log(`${name}: ${receipt.contractAddress}`);
  return receipt.contractAddress;
}

const usdc = await deploy("TestUSDC");
const vault = await deploy("QuiverVault", [usdc]);
const perp = await deploy("QuiverPerp", [usdc]);

// perp can mint payouts on testnet
let hash = await wallet.writeContract({
  address: usdc,
  abi: contracts.TestUSDC.abi,
  functionName: "setMinter",
  args: [perp, true],
});
await pub.waitForTransactionReceipt({ hash });
console.log("perp set as tUSDC minter");

// list markets at live index prices ($10M virtual quote depth per market)
const SYMBOLS = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "HOOD"];
const res = await fetch("https://quiver-trade.com/api/prices");
const quotes = await res.json();
for (const s of SYMBOLS) {
  const price = quotes[s]?.price;
  if (!price) throw new Error(`no price for ${s}`);
  const priceScaled = parseUnits(price.toFixed(6), 6);
  const baseReserve = (10_000_000n * 10n ** 18n * 10n ** 6n) / priceScaled;
  hash = await wallet.writeContract({
    address: perp,
    abi: contracts.QuiverPerp.abi,
    functionName: "listMarket",
    args: [stringToHex(s, { size: 32 }), priceScaled, baseReserve],
  });
  await pub.waitForTransactionReceipt({ hash });
  console.log(`listed ${s} @ ${price}`);
}

fs.writeFileSync(
  new URL("../lib/deployments.json", import.meta.url),
  JSON.stringify(
    { chainId: 46630, testUSDC: usdc, quiverVault: vault, quiverPerp: perp },
    null,
    2,
  ),
);
fs.writeFileSync(
  new URL("../lib/abis.json", import.meta.url),
  JSON.stringify(
    {
      TestUSDC: contracts.TestUSDC.abi,
      QuiverVault: contracts.QuiverVault.abi,
      QuiverPerp: contracts.QuiverPerp.abi,
    },
    null,
    2,
  ),
);
console.log("wrote lib/deployments.json and lib/abis.json");
