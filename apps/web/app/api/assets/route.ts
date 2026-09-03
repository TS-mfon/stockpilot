import { getAssetRegistry } from "../../../lib/runtime";

export function GET() {
  const assets = getAssetRegistry();
  return Response.json({ version: process.env.NEXT_PUBLIC_ASSET_REGISTRY_VERSION ?? "demo-only-2026-09-03", chainId: 8453, count: assets.length, assets, source: "demo registry; issuer verification required before execution" });
}
