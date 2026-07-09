import fs from "node:fs";
import solc from "solc";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const chain = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com"] } },
});

const source = fs.readFileSync(new URL("../contracts/Quiver.sol", import.meta.url), "utf8");
const input = {
  language: "Solidity",
  sources: { "Quiver.sol": { content: source } },
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
const contracts = out.contracts["Quiver.sol"];

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

fs.writeFileSync(
  new URL("../lib/deployments.json", import.meta.url),
  JSON.stringify({ chainId: 46630, testUSDC: usdc, quiverVault: vault }, null, 2),
);
fs.writeFileSync(
  new URL("../lib/abis.json", import.meta.url),
  JSON.stringify(
    { TestUSDC: contracts.TestUSDC.abi, QuiverVault: contracts.QuiverVault.abi },
    null,
    2,
  ),
);
console.log("wrote lib/deployments.json and lib/abis.json");
