import demoAssets from "../../../data/seed/demo-assets.json";
import routes from "../../../data/seed/routes.json";
import type { VerifiedAsset } from "../../../packages/domain/src/index";

export const runtimeConfig = {
  mode: process.env.NEXT_PUBLIC_MODE ?? "simulation",
  baseChainId: Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID ?? 8453),
  testnetChainId: Number(process.env.NEXT_PUBLIC_BASE_TESTNET_CHAIN_ID ?? 84532),
  genlayerChainId: Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? 61999),
  genlayerRpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api",
  registryVersion: process.env.NEXT_PUBLIC_ASSET_REGISTRY_VERSION ?? "demo-only-2026-09-03",
  liveExecutionEnabled: process.env.LIVE_EXECUTION_ENABLED === "true",
  mainnetPilotEnabled: process.env.MAINNET_PILOT_ENABLED === "true",
};

export function getAssetRegistry(): VerifiedAsset[] {
  return demoAssets as VerifiedAsset[];
}

export function getRouteRegistry() { return routes; }

export function executionReadiness() {
  const blockers = [
    "Demo registry only: replace with issuer-verified Base token addresses",
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
