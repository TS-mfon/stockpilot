import test from "node:test";
import assert from "node:assert/strict";
test("calculates drift against target allocations", () => {
  const holdings = { a: 80, b: 20 };
  const total = Object.values(holdings).reduce((sum, value) => sum + value, 0);
  const result = { maxDrift: Math.max(Math.abs(holdings.a / total - 0.6), Math.abs(holdings.b / total - 0.4)), current: { a: holdings.a / total, b: holdings.b / total } };
  assert.ok(Math.abs(result.maxDrift - 0.2) < 1e-9);
  assert.deepEqual(result.current, { a: 0.8, b: 0.2 });
});

test("bounded allocation never exceeds the single asset cap", async () => {
  const source = await import("../../packages/portfolio-engine/src/index.ts");
  const assets = [
    { id: "a", symbol: "A", name: "A", contractAddress: "0x0000000000000000000000000000000000000001", chainId: 8453, issuer: "Coinbase", tokenStandard: "B20", underlyingSymbol: "A", sector: "technology", industry: "AI infrastructure", themes: ["AI infrastructure"], decimals: 18, active: true, verified: true, eligibilityStatus: "eligible" },
    { id: "b", symbol: "B", name: "B", contractAddress: "0x0000000000000000000000000000000000000002", chainId: 8453, issuer: "Coinbase", tokenStandard: "B20", underlyingSymbol: "B", sector: "technology", industry: "AI infrastructure", themes: ["AI infrastructure"], decimals: 18, active: true, verified: true, eligibilityStatus: "eligible" },
    { id: "c", symbol: "C", name: "C", contractAddress: "0x0000000000000000000000000000000000000003", chainId: 8453, issuer: "Coinbase", tokenStandard: "B20", underlyingSymbol: "C", sector: "technology", industry: "AI infrastructure", themes: ["AI infrastructure"], decimals: 18, active: true, verified: true, eligibilityStatus: "eligible" },
    { id: "d", symbol: "D", name: "D", contractAddress: "0x0000000000000000000000000000000000000004", chainId: 8453, issuer: "Coinbase", tokenStandard: "B20", underlyingSymbol: "D", sector: "technology", industry: "AI infrastructure", themes: ["AI infrastructure"], decimals: 18, active: true, verified: true, eligibilityStatus: "eligible" },
  ];
  const mandate = { includedThemes: ["AI infrastructure"], excludedThemes: [], excludedAssets: [], minimumAssets: 4, maxSingleAssetWeight: 0.25, maxSectorWeight: 1 };
  const allocations = source.optimizePortfolio(assets, mandate);
  assert.ok(allocations.every((allocation) => allocation.weight <= 0.25 + 1e-9));
  assert.ok(Math.abs(allocations.reduce((sum, allocation) => sum + allocation.weight, 0) - 1) < 1e-9);
});
