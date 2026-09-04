export type Address = `0x${string}`;

export type RiskProfile = "conservative" | "balanced" | "growth";
export type Cadence = "manual" | "daily" | "weekly" | "monthly";

export type VerifiedAsset = {
  id: string;
  symbol: string;
  name: string;
  contractAddress: Address;
  chainId: 8453;
  issuer: string;
  tokenStandard: string;
  underlyingSymbol: string;
  sector: string;
  industry: string;
  themes: string[];
  decimals: number;
  active: boolean;
  verified: boolean;
  eligibilityStatus: "eligible" | "restricted" | "unknown";
  priceFeed?: Address;
};

export type VenueRegistry = {
  version: string;
  chainId: number;
  venue: {
    id: string;
    name: string;
    router: Address;
    factory: Address;
    weth: Address;
    usdc: Address;
  };
  pools?: Record<string, Address>;
};

export type RouteStatus = "available" | "unavailable" | "unverified";

export type AssetRoute = {
  id: string;
  assetId: string;
  venueId: string;
  chainId: number;
  tokenIn: Address;
  tokenOut: Address;
  status: RouteStatus;
  liquidityUsd: number | null;
  priceImpactBps: number | null;
  feeBps: number | null;
  checkedAt: string | null;
  reason: string;
  pool?: Address;
  stable?: boolean;
  factory?: Address;
  router?: Address;
  quoteAmountOut?: string;
};

export type Mandate = {
  theme: string;
  objectives: string[];
  includedThemes: string[];
  excludedThemes: string[];
  excludedAssets: string[];
  riskProfile: RiskProfile;
  timeHorizon: "short_term" | "medium_term" | "long_term";
  minimumAssets: number;
  maxSingleAssetWeight: number;
  maxSectorWeight: number;
  rebalanceThreshold: number;
  cadence: Cadence;
};

export type Allocation = { assetId: string; weight: number; score: number; reason: string };

export type Portfolio = {
  portfolioId: string;
  mandate: Mandate;
  allocations: Allocation[];
  status: "simulation" | "active" | "blocked";
  health: Record<string, number>;
  createdAt: string;
};

export const DEFAULT_MANDATE: Mandate = {
  theme: "AI infrastructure",
  objectives: ["growth", "theme_exposure", "diversification"],
  includedThemes: ["AI infrastructure"],
  excludedThemes: [],
  excludedAssets: [],
  riskProfile: "growth",
  timeHorizon: "long_term",
  minimumAssets: 4,
  maxSingleAssetWeight: 0.25,
  maxSectorWeight: 1,
  rebalanceThreshold: 0.05,
  cadence: "monthly",
};
