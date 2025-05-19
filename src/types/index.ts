/**
 * Shared domain types (placeholders)
 * ---------------------------------------------------------------------------
 * TODO: Flesh out these interfaces once the data model is finalized.
 */

export interface Traveler {
  id: string;
  firstName: string;
  lastName: string;
  // TODO: add email, phone, etc.
}

export interface TravelRequest {
  hotel: object;  // TODO: replace `object` with a concrete HotelBooking type
  flight: object; // TODO: replace `object` with a concrete FlightBooking type
  car: object;    // TODO: replace `object` with a concrete CarBooking type
}

/** Raw form payloads (key-value maps until schemas are finalized) */
export type HotelFormData = Record<string, unknown>;
export type FlightFormData = Record<string, unknown>;
export type CarFormData   = Record<string, unknown>;
