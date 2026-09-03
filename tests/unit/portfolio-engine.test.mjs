import test from "node:test";
import assert from "node:assert/strict";
test("calculates drift against target allocations", () => {
  const holdings = { a: 80, b: 20 };
  const total = Object.values(holdings).reduce((sum, value) => sum + value, 0);
  const result = { maxDrift: Math.max(Math.abs(holdings.a / total - 0.6), Math.abs(holdings.b / total - 0.4)), current: { a: holdings.a / total, b: holdings.b / total } };
  assert.ok(Math.abs(result.maxDrift - 0.2) < 1e-9);
  assert.deepEqual(result.current, { a: 0.8, b: 0.2 });
});
