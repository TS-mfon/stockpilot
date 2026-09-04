import { getRouteRegistry } from "../../../lib/runtime";

export function GET() {
  const routes = getRouteRegistry().filter((route) => route.available).sort((a, b) => a.priceImpactBps - b.priceImpactBps);
  return Response.json({ chainId: 84532, mode: "demo", routes, bestRoute: routes[0] ?? null, disclaimer: "Demo route quotes; no transaction is submitted." });
}
