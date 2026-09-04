import { getRouteOptions } from "../../../lib/venues";
import { getRouteRegistry } from "../../../lib/runtime";

export function GET() {
  const registry = getRouteRegistry();
  const routes = getRouteOptions();
  return Response.json({ chainId: registry.chainId, mode: "discovery", venue: registry.venue, routes, bestRoute: routes.find((route) => route.status === "available") ?? null, disclaimer: "Only routes with verified pool liquidity and quotes can be used for execution." });
}
