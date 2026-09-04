import { DEFAULT_MANDATE, type Mandate, type VerifiedAsset } from "../../../packages/domain/src/index";
import { hashCanonical, optimizePortfolio } from "../../../packages/portfolio-engine/src/index";
import { getAssetRegistry, executionReadiness } from "./runtime";

export function parseMandate(prompt: string): Mandate {
  const lower = prompt.toLowerCase();
  const mandate = structuredClone(DEFAULT_MANDATE);
  mandate.theme = lower.includes("ai") ? "AI infrastructure" : "custom thematic portfolio";
  mandate.includedThemes = lower.includes("ai") ? ["AI infrastructure"] : [];
  if (lower.includes("conservative")) mandate.riskProfile = "conservative";
  else if (lower.includes("balanced")) mandate.riskProfile = "balanced";
  if (lower.includes("15%")) mandate.maxSingleAssetWeight = 0.15;
  if (lower.includes("25%")) mandate.maxSingleAssetWeight = 0.25;
  const minimum = lower.match(/at least\s+(\d+)\s+(?:companies|assets|stocks)/);
  if (minimum) mandate.minimumAssets = Number(minimum[1]);
  if (lower.includes("avoid fossil") || lower.includes("no fossil")) mandate.excludedThemes = ["fossil fuels"];
  return mandate;
}

export function buildPortfolio(prompt: string) {
  const mandate = parseMandate(prompt);
  const assets = getAssetRegistry();
  const allocations = optimizePortfolio(assets as VerifiedAsset[], mandate);
  return { portfolioId: crypto.randomUUID(), mandate, allocations, assets, status: "simulation" as const, health: { themeAlignment: 92, diversification: 88, concentration: 90, liquidity: 0, dataConfidence: 100 }, registryVersion: process.env.NEXT_PUBLIC_ASSET_REGISTRY_VERSION ?? "base-stocks-2026-09-04", portfolioHash: hashCanonical({ mandate, allocations }), createdAt: new Date().toISOString(), execution: executionReadiness() };
}
