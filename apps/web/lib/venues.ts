import venues from "../../../data/seed/venues.json";

export function getVenueRegistry() { return venues; }

export function venueReadiness() {
  return venues.venues.filter((venue) => venue.approved && venue.router && venue.factory).length > 0
    ? { enabled: true, venues: venues.venues }
    : { enabled: false, venues: venues.venues, blockers: ["No approved testnet venue has been configured"] };
}
