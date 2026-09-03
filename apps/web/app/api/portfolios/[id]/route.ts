import { getPortfolio } from "../../../../lib/mongo";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const portfolio = await getPortfolio(id);
  return portfolio ? Response.json(portfolio) : Response.json({ error: "portfolio not found" }, { status: 404 });
}
