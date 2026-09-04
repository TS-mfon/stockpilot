import venues from "../../../data/seed/venues.json";
import { getAssetRegistry, getRouteRegistry } from "./runtime";
import type { AssetRoute } from "../../../packages/domain/src/index";

export function getVenueRegistry() { return venues; }

export function getRouteOptions(): AssetRoute[] {
  const registry = getRouteRegistry();
  const assets = getAssetRegistry();
  return assets.map((asset) => ({
    id: `${registry.venue.id}-${asset.id}-usdc`,
    assetId: asset.id,
    venueId: registry.venue.id,
    chainId: registry.chainId,
    tokenIn: registry.venue.usdc,
    tokenOut: asset.contractAddress,
    status: "unverified",
    liquidityUsd: null,
    priceImpactBps: null,
    feeBps: null,
    checkedAt: null,
    reason: "Pool discovery and quote verification are required before execution.",
  }));
}

export function venueReadiness() {
  const registry = getRouteRegistry();
  return registry.venue.router && registry.venue.factory
    ? { enabled: false, venues: [registry.venue], blockers: ["Venue address is configured, but pool liquidity and quotes are not verified"] }
    : { enabled: false, venues: [registry.venue], blockers: ["No approved venue has been configured"] };
}
