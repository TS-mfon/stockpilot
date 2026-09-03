import { getVenueRegistry, venueReadiness } from "../../../lib/venues";

export function GET() { return Response.json({ registry: getVenueRegistry(), readiness: venueReadiness() }); }
