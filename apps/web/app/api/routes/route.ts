import { getRouteOptions } from "../../../lib/venues";
import { getRouteRegistry } from "../../../lib/runtime";

export async function GET(request: Request) {
  const registry = getRouteRegistry();
  const amountUsdc = Number(new URL(request.url).searchParams.get("amountUsdc") ?? "100");
  const routes = await getRouteOptions(Number.isFinite(amountUsdc) ? amountUsdc : 100);
  return Response.json({ chainId: registry.chainId, mode: "discovery", venue: registry.venue, routes, bestRoute: routes.find((route) => route.status === "available") ?? null, disclaimer: "Only routes with verified pool liquidity and quotes can be used for execution." });
}
