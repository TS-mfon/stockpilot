import { buildPortfolio } from "./portfolio";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { prompt?: unknown };
    if (typeof body.prompt !== "string" || body.prompt.trim().length < 8) return Response.json({ error: "prompt must contain at least 8 characters" }, { status: 400 });
    return Response.json(buildPortfolio(body.prompt));
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "portfolio generation failed" }, { status: 422 }); }
}
