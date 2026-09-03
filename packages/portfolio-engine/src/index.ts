import { createHash } from "node:crypto";
import type { Allocation, Mandate, VerifiedAsset } from "@stockpilot/domain";

export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, nested) => {
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return Object.fromEntries(Object.entries(nested).sort(([a], [b]) => a.localeCompare(b)));
    }
    return nested;
  });
}

export function hashCanonical(value: unknown): `0x${string}` {
  return `0x${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

export function eligibleAssets(assets: VerifiedAsset[], mandate: Mandate): VerifiedAsset[] {
  return assets.filter((asset) => asset.verified && asset.active && asset.chainId === 8453 && asset.eligibilityStatus === "eligible")
    .filter((asset) => !mandate.excludedAssets.includes(asset.id) && !asset.themes.some((theme) => mandate.excludedThemes.includes(theme)));
}

function themeScore(asset: VerifiedAsset, mandate: Mandate): number {
  const hits = asset.themes.filter((theme) => mandate.includedThemes.includes(theme)).length;
  return Math.min(1, 0.35 + hits * 0.3 + (asset.industry.toLowerCase().includes("infra") ? 0.15 : 0));
}

export function scoreAssets(assets: VerifiedAsset[], mandate: Mandate): Map<string, number> {
  return new Map(assets.map((asset) => [asset.id, Number(themeScore(asset, mandate).toFixed(6))]));
}

export function optimizePortfolio(assets: VerifiedAsset[], mandate: Mandate): Allocation[] {
  const candidates = eligibleAssets(assets, mandate);
  if (candidates.length < mandate.minimumAssets) throw new Error(`Only ${candidates.length} verified assets satisfy the mandate; ${mandate.minimumAssets} required`);
  const scores = scoreAssets(candidates, mandate);
  const selected = [...candidates].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)).slice(0, Math.max(mandate.minimumAssets, 6));
  const rawTotal = selected.reduce((sum, asset) => sum + (scores.get(asset.id) ?? 0), 0);
  const base = selected.map((asset) => ({ asset, score: scores.get(asset.id) ?? 0, weight: (scores.get(asset.id) ?? 0) / rawTotal }));
  const capped = base.map((entry) => ({ ...entry, weight: Math.min(entry.weight, mandate.maxSingleAssetWeight) }));
  const cappedTotal = capped.reduce((sum, entry) => sum + entry.weight, 0);
  const allocations = capped.map(({ asset, score, weight }) => ({
    assetId: asset.id,
    weight: weight / cappedTotal,
    score,
    reason: `Thematic fit ${Math.round(score * 100)}/100; included under the ${mandate.theme} mandate and capped by concentration rules.`,
  }));
  validateAllocations(allocations, candidates, mandate);
  return allocations;
}

export function validateAllocations(allocations: Allocation[], assets: VerifiedAsset[], mandate: Mandate): void {
  const sum = allocations.reduce((total, allocation) => total + allocation.weight, 0);
  if (Math.abs(sum - 1) > 1e-9) throw new Error(`Allocation weights must sum to 1; got ${sum}`);
  if (allocations.length < mandate.minimumAssets) throw new Error("Minimum asset count not met");
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  for (const allocation of allocations) {
    if (allocation.weight < 0 || allocation.weight > mandate.maxSingleAssetWeight + 1e-9) throw new Error(`Single asset cap violated for ${allocation.assetId}`);
    const asset = byId.get(allocation.assetId);
    if (!asset?.verified || !asset.active) throw new Error(`Unverified or inactive asset ${allocation.assetId}`);
  }
  const sectors = new Map<string, number>();
  for (const allocation of allocations) {
    const sector = byId.get(allocation.assetId)?.sector ?? "unknown";
    sectors.set(sector, (sectors.get(sector) ?? 0) + allocation.weight);
  }
  for (const [sector, weight] of sectors) if (weight > mandate.maxSectorWeight + 1e-9) throw new Error(`Sector cap violated for ${sector}`);
}

export function calculateDrift(targets: Allocation[], holdings: Record<string, number>): { maxDrift: number; current: Record<string, number> } {
  const total = Object.values(holdings).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return { maxDrift: 1, current: {} };
  const current = Object.fromEntries(Object.entries(holdings).map(([assetId, value]) => [assetId, value / total]));
  const maxDrift = Math.max(...targets.map((target) => Math.abs((current[target.assetId] ?? 0) - target.weight)), ...Object.keys(current).filter((id) => !targets.some((target) => target.assetId === id)).map((id) => current[id]));
  return { maxDrift, current };
}
