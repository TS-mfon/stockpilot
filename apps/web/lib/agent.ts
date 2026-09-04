import { createAccount, createClient } from "genlayer-js";
import { hashCanonical } from "../../../packages/portfolio-engine/src/index";
import { getAssetRegistry, runtimeConfig } from "./runtime";
import { getRouteOptions } from "./venues";

type DecisionOption = { asset_id: string; route_id: string; weight: string | number; reason_codes: string[] };
type Decision = { decision?: "BUY" | "SKIP" | "REJECT"; asset_id?: string; route_id?: string; weight?: string | number; reason_codes?: string[]; options?: DecisionOption[] };

async function readDecision(client: ReturnType<typeof createClient>, address: `0x${string}`, requestId: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const decision = await client.readContract({ address, functionName: "get_decision", args: [requestId] }) as unknown as Decision;
    if (decision.decision) return decision;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return null;
}

export async function askStockPilotAgent(mandate: string) {
  const address = process.env.GENLAYER_STOCKPILOT_AGENT_ADDRESS as `0x${string}` | undefined;
  const key = process.env.GENLAYER_OPERATOR_PRIVATE_KEY as `0x${string}` | undefined;
  if (!address || !key) return { mode: "unconfigured", reason: "StockPilotAgent address or operator key is not configured", decision: null };
  const requestId = crypto.randomUUID();
  const assets = getAssetRegistry();
  const routeOptions = await getRouteOptions();
  const routes = routeOptions.filter((route) => route.status === "available");
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
  if (status !== "FINALIZED" && status !== "ACCEPTED") return { mode: "genlayer", requestId, transactionHash, status, decision: null, routeCount: routes.length, routeDiagnostics: routeOptions.map((route) => ({ assetId: route.assetId, status: route.status, reason: route.reason })), hash: hashCanonical(payload) };
  const decision = await readDecision(client, address, requestId);
  if (!decision) return { mode: "genlayer", requestId, transactionHash, status, decision: null, reason: "Decision reached consensus but is not readable yet" };
  const decisionHash = await client.readContract({ address, functionName: "get_decision_hash", args: [requestId] });
  return { mode: "genlayer", requestId, transactionHash, status, decision, decisionHash };
}
