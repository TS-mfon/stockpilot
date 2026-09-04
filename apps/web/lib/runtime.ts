import assetRegistry from "../../../data/seed/assets.json";
import routeRegistry from "../../../data/seed/routes.json";
import type { VerifiedAsset, VenueRegistry } from "../../../packages/domain/src/index";

export const runtimeConfig = {
  mode: process.env.NEXT_PUBLIC_MODE ?? "simulation",
  baseChainId: Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID ?? 8453),
  testnetChainId: Number(process.env.NEXT_PUBLIC_BASE_TESTNET_CHAIN_ID ?? 84532),
  genlayerChainId: Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? 61999),
  genlayerRpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api",
  registryVersion: process.env.NEXT_PUBLIC_ASSET_REGISTRY_VERSION ?? assetRegistry.version,
  liveExecutionEnabled: process.env.LIVE_EXECUTION_ENABLED === "true",
  mainnetPilotEnabled: process.env.MAINNET_PILOT_ENABLED === "true",
};

export function getAssetRegistry(): VerifiedAsset[] {
  return assetRegistry.assets as VerifiedAsset[];
}

export function getRouteRegistry(): VenueRegistry { return routeRegistry as VenueRegistry; }

export function executionReadiness() {
  const blockers = [
    "User eligibility is not checked by this demo",
    "Eligibility provider not configured",
    "Approved Aerodrome route registry not configured",
    "Smart-account permission verifier not configured",
    "Base settlement reconciler not configured",
  ];
  return {
    mode: runtimeConfig.mode,
    simulationEnabled: true,
    testnetExecutionEnabled: runtimeConfig.mode === "testnet" && runtimeConfig.liveExecutionEnabled,
    mainnetExecutionEnabled: runtimeConfig.mode === "mainnet" && runtimeConfig.liveExecutionEnabled && runtimeConfig.mainnetPilotEnabled && blockers.length === 0,
    blockers,
    checkedAt: new Date().toISOString(),
  };
}
