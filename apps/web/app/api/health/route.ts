import { genlayerStatus } from "../../../lib/genlayer";
import { executionReadiness } from "../../../lib/runtime";
import { venueReadiness } from "../../../lib/venues";

export async function GET() {
  const genlayer = await genlayerStatus();
  const execution = executionReadiness();
  const venue = venueReadiness();
  return Response.json({ status: genlayer.status === "configured" && venue.enabled && execution.blockers.length === 0 ? "ready" : "blocked", genlayer, venue, execution, database: process.env.MONGODB_URI ? "configured" : "unconfigured", checkedAt: new Date().toISOString() });
}
