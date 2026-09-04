import venues from "../../../data/seed/venues.json";
import { getAssetRegistry, getRouteRegistry } from "./runtime";
import type { AssetRoute } from "../../../packages/domain/src/index";
import { createPublicClient, http, parseUnits } from "viem";
import { base } from "viem/chains";

const factoryAbi = [{ name: "getPool", type: "function", stateMutability: "view", inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }, { name: "stable", type: "bool" }], outputs: [{ name: "pool", type: "address" }] }] as const;
const routerAbi = [{ name: "getAmountsOut", type: "function", stateMutability: "view", inputs: [{ name: "amountIn", type: "uint256" }, { name: "routes", type: "tuple[]", components: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "stable", type: "bool" }, { name: "factory", type: "address" }] }], outputs: [{ name: "amounts", type: "uint256[]" }] }] as const;
async function readWithRetry<T>(read: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try { return await read(); } catch (error) { lastError = error; await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1))); }
  }
  throw lastError;
}

export function getVenueRegistry() { return venues; }

export async function getRouteOptions(amountUsdc = 100): Promise<AssetRoute[]> {
  const registry = getRouteRegistry();
  const assets = getAssetRegistry();
  const publicClient = createPublicClient({ chain: base, transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL ?? "https://mainnet.base.org") });
  const amountIn = parseUnits(String(Math.max(0.01, amountUsdc)), 6);
  const routes: AssetRoute[] = [];
  for (const asset of assets) {
    const baseRoute = { id: `${registry.venue.id}-${asset.id}-usdc`, assetId: asset.id, venueId: registry.venue.id, chainId: registry.chainId, tokenIn: registry.venue.usdc, tokenOut: asset.contractAddress, status: "unavailable" as const, liquidityUsd: null, priceImpactBps: null, feeBps: null, checkedAt: new Date().toISOString(), reason: "No verified liquidity pool or quote found." };
    try {
      const pool = await readWithRetry(() => publicClient.readContract({ address: registry.venue.factory, abi: factoryAbi, functionName: "getPool", args: [asset.contractAddress, registry.venue.usdc, false] }));
      if (pool === "0x0000000000000000000000000000000000000000") { routes.push({ ...baseRoute, reason: "No Aerodrome volatile pool exists for this asset and USDC pair." }); continue; }
      const amounts = await readWithRetry(() => publicClient.readContract({ address: registry.venue.router, abi: routerAbi, functionName: "getAmountsOut", args: [amountIn, [{ from: registry.venue.usdc, to: asset.contractAddress, stable: false, factory: registry.venue.factory }]] }));
      routes.push({ ...baseRoute, status: "available", pool, stable: false, factory: registry.venue.factory, router: registry.venue.router, quoteAmountOut: String(amounts[1]), reason: "Verified Aerodrome pool and router quote." });
    } catch (error) { routes.push({ ...baseRoute, reason: `Route verification failed: ${error instanceof Error ? error.message.slice(0, 120) : "RPC error"}` }); }
  }
  return routes;
}

export function venueReadiness() {
  const registry = getRouteRegistry();
  return registry.venue.router && registry.venue.factory
    ? { enabled: false, venues: [registry.venue], blockers: ["Pool discovery and quote verification run per asset before execution"] }
    : { enabled: false, venues: [registry.venue], blockers: ["No approved venue has been configured"] };
}
