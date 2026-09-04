import { getAssetRegistry } from "../../../../lib/runtime";
import { getRouteOptions } from "../../../../lib/venues";

export async function GET(request: Request) {
  if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ ok: true, assetCount: getAssetRegistry().length, routeCount: getRouteOptions().length, action: "manual pool and quote verification required", at: new Date().toISOString() });
}
