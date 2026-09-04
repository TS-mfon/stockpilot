import { askStockPilotAgent } from "../../../../lib/agent";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { mandate?: unknown };
    if (typeof body.mandate !== "string" || body.mandate.trim().length < 8) return Response.json({ error: "mandate must contain at least 8 characters" }, { status: 400 });
    return Response.json(await askStockPilotAgent(body.mandate));
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "agent analysis failed" }, { status: 502 }); }
}
