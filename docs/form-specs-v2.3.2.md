# Travel Request Field Specifications (v2 Unified)

> **Version:** v2.3.2 — adds per‑form Default Budget Guidance fields and refined Client Reference lock logic (May 2025).  All other sections are identical to v2.3.1.

This document is the **single source of truth** for every request field. It informs:

* React/Next DynamicForm generation
* Zod validation schemas
* Compact‑JWE encoding/decoding (`jweKey` column)
* Supabase / Knack table generation

### Column meanings

| Column       | Purpose                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| **id**       | Stable, camelCase identifier (dot‑notation allowed for sub‑fields)            |
| **label**    | User‑facing copy (i18n‑ready)                                                 |
| **type**     | Input component (*text*, *date*, *radio*, *map*, *object*, etc.)              |
| **required** | `✅` if always required`✅*cond*` if required when **Logic** conditions are met |
| **jweKey**   | ≤ 3‑char short key (blank → not included in `r`)                              |
| **tooltip**  | Context help (optional)                                                       |
| **notes**    | Misc. display or validation info                                              |
| **logic**    | Concise behaviour / dependency rules                                          |

---

## 📦 Shared Metadata (all requests)

| id                    | label                 | type   | required | jweKey | tooltip                                  | notes                                                     | logic                                   |
| --------------------- | --------------------- | ------ | -------- | ------ | ---------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| client                | Client                | text   | ✅        | `c`    | Client code or ID                        | populated from Admin link                                 | *claim* not in `r`                      |
| project               | Project               | text   | ✅        | `p`    | Project code or ID                       | populated from Admin link                                 | *claim*                                 |
| clientReference       | Client Reference      | text   | ⬜        | `cr`   | Free text (team / PO #)                  | may be **read‑only** if Admin link locked                 | read‑only flag derived from link claims |
| budgetGuidance.hotel  | Default Hotel Budget  | select | ⬜        | `bgh`  | Prefill guidance for hotel requests      | dropdown presets (Optimize, Mid‑range, Premium)           | editable in form                        |
| budgetGuidance.flight | Default Flight Budget | select | ⬜        | `bgf`  | Prefill guidance for flight requests     | dropdown presets (Lowest Logical Fare, Flexible, Premium) | editable in form                        |
| budgetGuidance.car    | Default Car Budget    | select | ⬜        | `bgc`  | Prefill guidance for rental car requests | dropdown presets (Economy, Mid‑size, SUV, Truck, Premium) | editable in form                        |
| role                  | Role                  | select | ✅        | –      | attAdmin / clientAdmin / requester       | inferred from link / login                                | *claim*                                 |
| exp                   | Expiry                | number | ⬜        | –      | Unix seconds                             | link invalid after time                                   | *claim*                                 |

### **Budget Guidance Behaviour**

* Values are pre‑populated from the Admin‑generated link.
* Requesters **may override** the defaults inside each form section.
* Overrides are stored in the respective form’s `budgetGuidance` field (`hotel.budgetGuidance`, etc.).

### **Client Reference Lock Behaviour**

* Admin link can include flag `crl:1` (*client reference locked*).
* If present, UI renders the **Client Reference** field as read‑only and prevents edits.
* Flag is *not* persisted in the final request object; only the text value `cr` is stored.

---

## 🏨 Hotel Request Fields

| id                        | label                | type     | required | jweKey | tooltip                     | notes                 | logic                                       |
| ------------------------- | -------------------- | -------- | -------- | ------ | --------------------------- | --------------------- | ------------------------------------------- |
| targetLocationType        | Target Location Type | radio    | ✅        | `lt`   | Specific / General          | drives Map Input mode | shows/hides radius                          |
| location.text             | Location Input       | map      | ✅        | `lx`   | HERE Places autocomplete    | populates lat/lng     | always visible                              |
| location.lat              | Latitude             | hidden   | ✅        | `la`   | resolved coord              | hidden                | auto‑set by map                             |
| location.lng              | Longitude            | hidden   | ✅        | `ln`   | resolved coord              | hidden                | auto‑set by map                             |
| location.radius           | Search Radius (mi)   | slider   | ⬜        | `lr`   | 1‑50 (default 10)           | –                     | visible when `targetLocationType = general` |
| checkInDate               | Check‑In Date        | date     | ✅        | `ci`   | Planned arrival             | min ≥ today           | –                                           |
| checkOutDate              | Check‑Out Date       | date     | ✅        | `co`   | Planned departure           | –                     | must be `> checkInDate`                     |
| room.group\[].roomType    | Room Type            | select   | ⬜        | `rt`   | King/Double/Suite           | per‑room sub‑field    | inside expandable room list                 |
| room.group\[].travelerIds | Room Assignment      | array    | ⬜        | `rg`   | traveller IDs               | JSON                  | defaults: 1 traveller per room              |
| notes                     | Notes                | textarea | ⬜        | `nt`   | Special needs / preferences | multiline             | –                                           |
| budgetGuidance            | Budget Guidance      | select   | ⬜        | `bgh`  | May prefill default         | –                     | editable if no lock                         |

### Behaviour

* Single **MapLocationInput** handles *Specific* (pin) & *General* (radius circle) modes.
* *room.group* is an array of objects accessed via dot‑notation (`room.group[0].roomType`, etc.).

---

## ✈️ Flight Request Fields

| id                           | label                 | type          | required | jweKey | tooltip                              | notes                                                 | logic                                                            |
| ---------------------------- | --------------------- | ------------- | -------- | ------ | ------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------- |
| departureAirport             | Departure Airport     | airportPicker | ✅        | `da`   | IATA / name                          | –                                                     | –                                                                |
| arrivalAirport               | Arrival Airport       | airportPicker | ✅        | `aa`   | IATA / name                          | –                                                     | –                                                                |
| tripType                     | Trip Type             | select        | ✅        | `tt`   | One‑Way / Round‑Trip                 | –                                                     | if `oneWay` hide all *Return* fields                             |
| flightDate                   | Departure Date        | date          | ✅        | `fd`   | –                                    | –                                                     | –                                                                |
| returnDate                   | Return Date           | date          | ✅*cond*  | `fr`   | Round‑trip only                      | –                                                     | shown when `tripType = roundTrip`                                |
| flightTimePrefDepart         | Time Pref – Departure | select        | ⬜        | `fp`   | Optimise / Morning …                 | default Optimise                                      | drives departure custom/specific fields                          |
| flightTimePrefReturn         | Time Pref – Return    | select        | ⬜*cond*  | `fpr`  | Optimise / Morning …                 | only round‑trip                                       | visible when `tripType = roundTrip`; drives return custom fields |
| flightTimeDepart.range.start | Depart Time Start     | time          | ⬜        | `ds`   | custom range                         | –                                                     | visible when `flightTimePrefDepart = custom`                     |
| flightTimeDepart.range.end   | Depart Time End       | time          | ⬜        | `de`   | custom range                         | –                                                     | –                                                                |
| flightTimeDepart.type        | Depart Time Type      | select        | ⬜        | `dt`   | Departure vs Arrival                 | indicates whether range refers to take‑off or landing | pairs with depart range                                          |
| flightTimeReturn.range.start | Return Time Start     | time          | ⬜*cond*  | `xs`   | custom range                         | –                                                     | visible when `flightTimePrefReturn = custom`                     |
| flightTimeReturn.range.end   | Return Time End       | time          | ⬜*cond*  | `xe`   | custom range                         | –                                                     | –                                                                |
| flightTimeReturn.type        | Return Time Type      | select        | ⬜*cond*  | `xt`   | Departure vs Arrival                 | indicates whether range refers to take‑off or landing | pairs with return range                                          |
| specificFlightInfo           | Specific Flight Info  | textarea      | ⬜        | `sfi`  | Airline / flight #                   | multiline                                             | visible when any *Time Pref* = specific                          |
| notes                        | Notes                 | textarea      | ⬜        | `nt`   | Alternate requests, split travellers | multiline                                             | –                                                                |
| budgetGuidance               | Budget Guidance       | select        | ⬜        | `bgf`  | May prefill default                  | –                                                     | editable if no lock                                              |

---

## 🚗 Rental Car Request Fields Rental Car Request Fields

| id                             | label                  | type              | required | jweKey | tooltip                      | notes                                              | logic                              |
| ------------------------------ | ---------------------- | ----------------- | -------- | ------ | ---------------------------- | -------------------------------------------------- | ---------------------------------- |
| pickupType                     | Pickup Location Type   | select            | ✅        | `pt`   | Airport / Specific / General | controls map vs airport                            | –                                  |
| pickup.location.text           | Pickup Location        | map/airportPicker | ✅        | `plx`  | dynamic component            | map if specific/general, airport picker if airport | –                                  |
| pickup.location.lat            | Pickup Lat             | hidden            | ✅        | `pla`  | –                            | –                                                  | auto via component                 |
| pickup.location.lng            | Pickup Lng             | hidden            | ✅        | `pln`  | –                            | –                                                  | –                                  |
| pickup.location.radius         | Pickup Search Radius   | slider            | ⬜        | `plr`  | general only                 | –                                                  | shown when `pickupType = general`  |
| rentalStart                    | Pickup Date            | date              | ✅        | `rs`   | –                            | –                                                  | –                                  |
| pickupTime                     | Pickup Time            | time              | ⬜        | `ptm`  | –                            | note if non‑airport                                | –                                  |
| sameDropoff                    | Drop‑Off = Pickup?     | checkbox          | ✅        | `sd`   | toggle                       | default checked                                    | –                                  |
| dropoffType                    | Drop‑Off Location Type | select            | ✅*cond*  | `dt`   | when different               | –                                                  | shown when `sameDropoff = false`   |
| dropoff.location.text          | Drop‑Off Location      | map/airportPicker | ✅*cond*  | `dlx`  | dynamic component            | follows rules of pickup                            | –                                  |
| dropoff.location.lat           | Drop‑Off Lat           | hidden            | ✅*cond*  | `dla`  | –                            | –                                                  | –                                  |
| dropoff.location.lng           | Drop‑Off Lng           | hidden            | ✅*cond*  | `dln`  | –                            | –                                                  | –                                  |
| dropoff.location.radius        | Drop‑Off Radius        | slider            | ⬜        | `dlr`  | general only                 | –                                                  | shown when `dropoffType = general` |
| rentalEnd                      | Drop‑Off Date          | date              | ✅        | `re`   | –                            | –                                                  | –                                  |
| dropoffTime                    | Drop‑Off Time          | time              | ⬜        | `dtm`  | –                            | –                                                  | shown when `pickupTime` present    |
| vehicle.group\[].travelerIds   | Vehicle Assignment     | array             | ⬜        | `va`   | traveller IDs                | hidden section                                     | expands to configure cars          |
| vehicle.group\[].primaryDriver | Primary Driver         | select            | ✅*cond*  | `pd`   | inside block                 | –                                                  | required per vehicle               |
| notes                          | Notes                  | textarea          | ⬜        | `nt`   | requests like 4WD            | multiline                                          | –                                  |
| budgetGuidance                 | Budget Guidance        | select            | ⬜        | `bgh`  | May prefill default          | –                                                  | editable if no lock                 |

---

## 👤 Traveller Reference Fields (embedded)

| id         | label       | type   | required | jweKey | tooltip              | notes              | logic               |
| ---------- | ----------- | ------ | -------- | ------ | -------------------- | ------------------ | ------------------- |
| travelerId | Traveler ID | select | ✅        | `ti`   | choose saved profile | duplicates removed | stored as UUID list |

---

## 📘 Global Notes

* Dot‑notation (`pickup.location.lat`) indicates a sub‑field on an *object* or *component state*.
* **MapLocationInput** is a single React component that switches behaviour based on `{locationType}` props.
* All `jweKey`s remain ≤ 3 chars and unique. Pre‑commit script validates duplicates & length.

> **Implementation Note** – A code‑gen script will append the new sub‑fields into `src/form-fields/*.json` schemas.  `fieldMap.ts` auto‑generates the `bgh`, `bgf`, `bgc` key map for JWE encoding.

---

## 🔗 Referenced By

* **Link Access Spec v2.2** (field map now references dot‑notation)
* DynamicForm engine (auto‑builds nested RHF fields)
* Admin UI wireframes (Map‑Input component)

### **Changelog**

* **v2.3.2** — Introduced `budgetGuidance.[hotel|flight|car]` and lockable `clientReference` behaviour.
* **v2.3.1** — Map‑Input refactor, dot‑notation, cleanup.  fileciteturn2file5

---

*End of spec*