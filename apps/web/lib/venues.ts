import { getAssetRegistry, getRouteRegistry } from "./runtime";
import type { AssetRoute } from "../../../packages/domain/src/index";
import { createPublicClient, fallback, http, parseUnits } from "viem";
import { base } from "viem/chains";

const factoryAbi = [{ name: "getPool", type: "function", stateMutability: "view", inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }, { name: "stable", type: "bool" }], outputs: [{ name: "pool", type: "address" }] }] as const;
const routerAbi = [{ name: "getAmountsOut", type: "function", stateMutability: "view", inputs: [{ name: "amountIn", type: "uint256" }, { name: "routes", type: "tuple[]", components: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "stable", type: "bool" }, { name: "factory", type: "address" }] }], outputs: [{ name: "amounts", type: "uint256[]" }] }] as const;
const poolAbi = [{ name: "getReserves", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "reserve0", type: "uint256" }, { name: "reserve1", type: "uint256" }, { name: "blockTimestampLast", type: "uint256" }] }, { name: "token0", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "token", type: "address" }] }] as const;
async function readWithRetry<T>(read: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try { return await read(); } catch (error) { lastError = error; await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1))); }
  }
  throw lastError;
}

function baseRpcUrls(): string[] {
  const configured = (process.env.NEXT_PUBLIC_BASE_RPC_URLS ?? process.env.NEXT_PUBLIC_BASE_RPC_URL ?? "")
    .split(",").map((url) => url.trim()).filter(Boolean);
  return [...new Set([...configured, "https://mainnet.base.org", "https://mainnet-preconf.base.org", "https://base-rpc.publicnode.com"])]
    .filter((url) => url.startsWith("https://"));
}

export function getVenueRegistry() { return getRouteRegistry(); }

export async function getRouteOptions(amountUsdc = 1): Promise<AssetRoute[]> {
  const registry = getRouteRegistry();
  const assets = getAssetRegistry();
  const publicClient = createPublicClient({ chain: base, transport: fallback(baseRpcUrls().map((url) => http(url))) });
  const amountIn = parseUnits(String(Math.max(0.01, amountUsdc)), 6);
  const routes: AssetRoute[] = [];
  for (const asset of assets) {
    const baseRoute = { id: `${registry.venue.id}-${asset.id}-usdc`, assetId: asset.id, venueId: registry.venue.id, chainId: registry.chainId, tokenIn: registry.venue.usdc, tokenOut: asset.contractAddress, status: "unavailable" as const, liquidityUsd: null, priceImpactBps: null, feeBps: null, checkedAt: new Date().toISOString(), reason: "No verified liquidity pool or quote found." };
    try {
      let pool: `0x${string}`;
      try {
        pool = await readWithRetry(() => publicClient.readContract({ address: registry.venue.factory, abi: factoryAbi, functionName: "getPool", args: [asset.contractAddress, registry.venue.usdc, false] }));
      } catch (error) {
        const cachedPool = registry.pools?.[asset.id];
        if (!cachedPool) throw error;
        pool = cachedPool;
      }
      if (pool === "0x0000000000000000000000000000000000000000") { routes.push({ ...baseRoute, reason: "No Aerodrome volatile pool exists for this asset and USDC pair." }); continue; }
      const [reserves, token0] = await Promise.all([
        readWithRetry(() => publicClient.readContract({ address: pool, abi: poolAbi, functionName: "getReserves" })),
        readWithRetry(() => publicClient.readContract({ address: pool, abi: poolAbi, functionName: "token0" })),
      ]);
      const usdcReserve = token0.toLowerCase() === registry.venue.usdc.toLowerCase() ? reserves[0] : reserves[1];
      if (usdcReserve < amountIn * 2n) { routes.push({ ...baseRoute, pool, reason: "Pool exists but has less than 2x the requested USDC depth." }); continue; }
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
