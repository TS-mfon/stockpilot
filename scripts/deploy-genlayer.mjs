import { readFile, writeFile } from "node:fs/promises";
import { createAccount, createClient } from "genlayer-js";

const key = process.env.GENLAYER_OPERATOR_PRIVATE_KEY;
if (!key) throw new Error("Set GENLAYER_OPERATOR_PRIVATE_KEY before deploying to Studionet");
const endpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api";
const client = createClient({ endpoint, account: createAccount(key) });
const owner = createAccount(key).address;
const files = ["PolicyAdjudicator", "PortfolioRegistry", "RebalanceAdjudicator"];
const deployment = { network: "studionet", chainId: Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? 61999), endpoint, owner, runner: "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6", contracts: {} };
for (const name of files) {
  const code = await readFile(`contracts/genlayer/${name}.py`, "utf8");
  const address = await client.deployContract({ code, args: [owner] });
  deployment.contracts[name] = address;
  console.log(`${name}: ${address}`);
}
await writeFile("deployment.genlayer.json", JSON.stringify(deployment, null, 2) + "\n");
console.log("Wrote deployment.genlayer.json");
