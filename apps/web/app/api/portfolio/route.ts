import { buildPortfolio } from "../../../lib/portfolio";
import { savePortfolio, recordAudit } from "../../../lib/mongo";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { prompt?: unknown };
    if (typeof body.prompt !== "string" || body.prompt.trim().length < 8) return Response.json({ error: "prompt must contain at least 8 characters" }, { status: 400 });
    const portfolio = buildPortfolio(body.prompt);
    await savePortfolio(portfolio);
    await recordAudit({ event: "PORTFOLIO_GENERATED", portfolioId: portfolio.portfolioId, portfolioHash: portfolio.portfolioHash, mode: portfolio.status });
    return Response.json(portfolio);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "portfolio generation failed" }, { status: 422 }); }
}
