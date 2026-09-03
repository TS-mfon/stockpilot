import { getAssetRegistry } from "../../../../lib/runtime";
import { getVenueRegistry } from "../../../../lib/venues";

export async function GET(request: Request) {
  if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ ok: true, assetCount: getAssetRegistry().length, venueCount: getVenueRegistry().venues.length, action: "manual verification required", at: new Date().toISOString() });
}
