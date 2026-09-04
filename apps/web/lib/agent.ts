import { createAccount, createClient } from "genlayer-js";
import { hashCanonical } from "../../../packages/portfolio-engine/src/index";
import { getAssetRegistry, runtimeConfig } from "./runtime";
import { getRouteOptions } from "./venues";

type Decision = { decision: "BUY" | "SKIP" | "REJECT"; asset_id: string; route_id: string; weight: number; reason_codes: string[] };

export async function askStockPilotAgent(mandate: string) {
  const address = process.env.GENLAYER_STOCKPILOT_AGENT_ADDRESS as `0x${string}` | undefined;
  const key = process.env.GENLAYER_OPERATOR_PRIVATE_KEY as `0x${string}` | undefined;
  if (!address || !key) return { mode: "mock", reason: "StockPilotAgent address or operator key is not configured", decision: mockDecision() };
  const requestId = crypto.randomUUID();
  const assets = getAssetRegistry();
  const routes = getRouteOptions().filter((route) => route.status === "available");
  const payload = { request_id: requestId, mandate, asset_ids: assets.map((asset) => asset.id), route_ids: routes.map((route) => route.id), assets, routes };
  const client = createClient({ endpoint: runtimeConfig.genlayerRpcUrl, account: createAccount(key) });
  const transactionHash = await client.writeContract({ address, functionName: "analyze", args: [JSON.stringify(payload)], value: 0n, consensusMaxRotations: 2 });
  let status = "PENDING";
  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const transaction = await client.getTransaction({ hash: transactionHash });
    status = transaction.statusName ?? String(transaction.status);
    if (status === "FINALIZED" || status === "ACCEPTED") break;
  }
  if (status !== "FINALIZED" && status !== "ACCEPTED") return { mode: "genlayer", requestId, transactionHash, status, decision: null, hash: hashCanonical(payload) };
  const decision = await client.readContract({ address, functionName: "get_decision", args: [requestId] }) as unknown as Decision;
  const decisionHash = await client.readContract({ address, functionName: "get_decision_hash", args: [requestId] });
  return { mode: "genlayer", requestId, transactionHash, status, decision, decisionHash };
}

function mockDecision() { return { decision: "SKIP" as const, asset_id: "", route_id: "", weight: 0, reason_codes: ["AGENT_NOT_CONFIGURED", "NO_VERIFIED_ROUTE"] }; }
