import { runtimeConfig } from "./runtime";

export type GenLayerStatus = "configured" | "unconfigured" | "unreachable";

export async function genlayerStatus(): Promise<{ status: GenLayerStatus; chainId: number; endpoint: string; reason?: string }> {
  if (!process.env.GENLAYER_OPERATOR_PRIVATE_KEY) return { status: "unconfigured", chainId: runtimeConfig.genlayerChainId, endpoint: runtimeConfig.genlayerRpcUrl, reason: "GENLAYER_OPERATOR_PRIVATE_KEY is not configured" };
  try {
    const response = await fetch(runtimeConfig.genlayerRpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "gen_getChainId", params: [] }), signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!response.ok) return { status: "unreachable", chainId: runtimeConfig.genlayerChainId, endpoint: runtimeConfig.genlayerRpcUrl, reason: `HTTP ${response.status}` };
    return { status: "configured", chainId: runtimeConfig.genlayerChainId, endpoint: runtimeConfig.genlayerRpcUrl };
  } catch (error) { return { status: "unreachable", chainId: runtimeConfig.genlayerChainId, endpoint: runtimeConfig.genlayerRpcUrl, reason: error instanceof Error ? error.message : "request failed" }; }
}
