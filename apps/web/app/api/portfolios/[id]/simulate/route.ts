import { getPortfolio } from "../../../../../lib/mongo";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const portfolio = await getPortfolio(id);
  if (!portfolio) return Response.json({ error: "portfolio not found" }, { status: 404 });
  const allocations = (portfolio.allocations ?? []) as { assetId: string; weight: number }[];
  const periods = Array.from({ length: 12 }, (_, index) => ({ period: index + 1, value: Number((10000 * (1 + index * 0.012)).toFixed(2)) }));
  return Response.json({ portfolioId: id, mode: "illustrative-simulation", startingValue: 10000, endingValue: periods.at(-1)?.value ?? 10000, maximumDrawdown: 0, periods, allocations, disclaimer: "Illustrative simulation only; this endpoint does not use historical market data and is not a prediction." });
}
