import { getAssetRegistry } from "../../../lib/runtime";

export function GET() {
  const assets = getAssetRegistry();
  return Response.json({ version: process.env.NEXT_PUBLIC_ASSET_REGISTRY_VERSION ?? "base-stocks-2026-09-04", chainId: 8453, count: assets.length, assets, source: "Coinbase Tokenized Stocks registry; route and eligibility verification are separate gates" });
}
