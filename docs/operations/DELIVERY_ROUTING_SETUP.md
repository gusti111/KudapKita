# Delivery Routing & Fee Configuration — KudapKita

Status: **configuration required; do not advertise automatic live route pricing until all values below are set and tested.**

## Customer-facing delivery policy

- Free delivery is intended for the **Pasar Bahagia** and **Kisaran Kuala Dua** service areas.
- Free delivery must be determined by service-area polygons or verified address coverage, not by a text-only keyword match.
- Outside the free zones, calculate the route using a drivable road network (not straight-line distance).
- Show the estimated delivery fee before the customer submits the order. The owner may confirm or correct an exceptional route before payment; never silently add a fee after payment.

## Recommended production flow

1. Customer enters an address and selects a map pin (Google Maps Places Autocomplete / map picker).
2. Backend geocodes and validates the destination coordinates.
3. Backend checks the destination against the configured free-delivery polygons.
4. If inside either polygon, return `fee = 0` and a clear `Gratis ongkir` label.
5. Otherwise call Google Maps Routes API (DRIVE mode) from the configured shop coordinate to the destination coordinate and read the road distance in metres.
6. Calculate the fee using owner-configured pricing, minimum fee, and distance rounding.
7. Return route distance, estimated duration, fee, and quote expiry. Store the quote snapshot with the order and revalidate it server-side at order creation.

## Fee formula (owner must confirm)

Suggested configurable formula:

`billableKm = ceil(routeDistanceMeters / 1000)`

`deliveryFee = max(minimumFee, baseFee + billableKm * ratePerKm)`

The actual values are **not yet confirmed**:
- `baseFee`: [OWNER CONFIRM]
- `ratePerKm`: [OWNER CONFIRM]
- `minimumFee`: [OWNER CONFIRM]
- `maximumServiceDistanceKm`: [OWNER CONFIRM]
- quote validity in minutes: [OWNER CONFIRM]

Consider a separate surcharge only if the owner explicitly approves it (for example, bridge/ferry or difficult-access areas). Do not invent surcharges.

## Required owner configuration

- Exact shop pickup pin (latitude/longitude) and customer-facing shop address.
- Polygon boundary for Pasar Bahagia free zone.
- Polygon boundary for Kisaran Kuala Dua free zone.
- Fee formula values listed above.
- Google Maps Platform project with Routes API and Places API enabled.
- Server-side API key stored as a Firebase Functions secret (never in Vite `VITE_*` variables or browser code).
- Billing limits, API restrictions, rate limiting, and server-side validation.

## Security and reliability

- Do not trust client-supplied route distance, zone, or fee.
- Compute and validate the route on the server.
- Cache quotes briefly and bind them to destination coordinates and order contents.
- If the route provider is unavailable, do not silently calculate a straight-line fallback. Tell the customer the fee needs manual confirmation.
- Test edge points on each polygon boundary and routes with tolls, ferries, private roads, and inaccessible destinations.

## Current implementation boundary

The storefront has been updated to explain the two intended free-delivery areas and the road-route pricing policy. The live map picker, polygon geofence, Routes API call, and owner-editable tariff settings are **not enabled yet** because the shop pin, zone boundaries, pricing values, and API credentials are not present in the supplied project configuration. This is intentional: guessed coordinates or fees would produce incorrect customer charges.
