import { getAssetRegistry } from "../../../../lib/runtime";
import { getRouteOptions } from "../../../../lib/venues";

export async function GET(request: Request) {
  if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  const routes = await getRouteOptions();
  return Response.json({ ok: true, assetCount: getAssetRegistry().length, routeCount: routes.length, availableRouteCount: routes.filter((route) => route.status === "available").length, action: "pool and quote verification completed", at: new Date().toISOString() });
}
