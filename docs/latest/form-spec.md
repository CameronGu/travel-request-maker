# Travel Request Field Specifications

> **Version:** **v2.3.4** 
— adds Middle Name, Preferred Name, Secondary Email, DOB, and Gender; clarifies first/last name must match travel document; retains earlier v2.3.3 changes.  (May 2025)

This document remains the **single source of truth** for every request field and feeds:

* React/Next **DynamicForm (Declarative) Engine**
* Zod validation schemas
* **Supabase** migrations (`requests.blob` jsonb)
  *MVP note – request data lives in DB, not in the share‑link token.*
* *Future* Possibly use compact‑JWE full‑payload links (**Phase 2**).  The `jweKey` column therefore stays **reserved** but is **not used** by the MVP link codec (`token = { link_id, exp }`).

---

### Column meanings

| Column       | Purpose                                                                           |
| ------------ | --------------------------------------------------------------------------------- |
| **id**       | Stable, camelCase identifier (dot‑notation allowed for sub‑fields)                |
| **label**    | User‑facing copy (i18n‑ready)                                                     |
| **type**     | Input component (*text*, *date*, *radio*, *map*, *object*, etc.)                  |
| **required** | `✅` if always required  •  `✅*cond*` if required **only when Logic is true**      |
| **jweKey**   | ≤ 3‑char short key – **unused in MVP**; **reserved** for Phase 2 full‑payload JWE |
| **tooltip**  | Context help (optional)                                                           |
| **notes**    | Misc. display or validation info                                                  |
| **logic**    | Concise behaviour / dependency rules                                              |

---

## Shared Metadata (all requests)

| id                    | label                 | type   | required | jweKey | tooltip                                  | notes                                                     | logic                                   |
| --------------------- | --------------------- | ------ | -------- | ------ | ---------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| client                | Client                | text   | ✅        | `c`    | Client code or ID                        | populated from Admin link                                 | *claim* (not in `blob` if from link)    |
| project               | Project               | text   | ✅        | `p`    | Project code or ID                       | populated from Admin link                                 | *claim*                                 |
| clientReference       | Client Reference      | text   | ⬜        | `cr`   | Free text (team / PO #)                  | may be **read‑only** if Admin link locked                 | read‑only flag derived from link claims |
| budgetGuidance.hotel  | Default Hotel Budget  | select | ⬜        | `bgh`  | Prefill guidance for hotel requests      | dropdown presets (Optimize, Mid‑range, Premium)           | editable in form                        |
| budgetGuidance.flight | Default Flight Budget | select | ⬜        | `bgf`  | Prefill guidance for flight requests     | dropdown presets (Lowest Logical Fare, Flexible, Premium) | editable in form                        |
| budgetGuidance.car    | Default Car Budget    | select | ⬜        | `bgc`  | Prefill guidance for rental car requests | dropdown presets (Economy, Mid‑size, SUV, Truck, Premium) | editable in form                        |
| role                  | Role                  | select | ✅        | –      | attAdmin / clientAdmin / requester       | inferred from share‑link / login                          | *claim*                                 |
| exp                   | Expiry                | number | ⬜        | –      | Unix seconds                             | link invalid after time                                   | *claim*                                 |

### Budget Guidance Behaviour

* Values pre‑populate from Admin‑generated link.
* Requesters **may override** inside each form section (unless locked by Admin flag).

### Client Reference Lock Behaviour

* Admin link can include flag `crl:1`; UI then renders **Client Reference** read‑only.

---

## 👤 Traveler Master Fields *(modal add / edit)*

| id             | label           | type   | required | jweKey | tooltip                                         | notes                               | logic                             |
| -------------- | --------------- | ------ | -------- | ------ | ----------------------------------------------- | ----------------------------------- | --------------------------------- |
| firstName      | First Name      | text   | ✅        | `fn`   | **Must match travel document** (given name)     | –                                   | –                                 |
| middleName     | Middle Name     | text   | ⬜        | `mn`   | *(optional)*                                    | –                                   | –                                 |
| lastName       | Last Name       | text   | ✅        | `ln`   | **Must match travel document** (surname)        | –                                   | –                                 |
| preferredName  | Preferred Name  | text   | ⬜        | `pn`   | Name used in communications                     | –                                   | –                                 |
| primaryEmail   | Primary Email   | email  | ✅        | `em`   | [example@domain.com](mailto:example@domain.com) | **deliverable address**             | Zod `email()`                     |
| secondaryEmail | Secondary Email | email  | ⬜        | `se`   | Backup contact email                            | –                                   | Zod `email()`                     |
| phone          | Mobile Phone    | tel    | ✅        | `ph`   | +Country code & number (e.g. +506…)             | **E.164** only                      | Zod `isValidE164()`               |
| dob            | Date of Birth   | date   | ⬜        | `db`   | MM‑DD-YYYY                                      | Required for international bookings | Zod `date()`                      |
| gender         | Gender (on ID)  | select | ⬜        | `gd`   | As shown on travel document                     | Options: M / F / X / Unspecified    | –                                 |
| isPlaceholder  | Placeholder?    | hidden | ⬜        | –      | auto‑set by **Quick Placeholder**               | default `false`; blocks submission  | backend prevents submit if `true` |

> **Quick Placeholder**: adds stub (`Traveler 1`, `isPlaceholder = true`) then focuses **Complete Traveler Details** modal before final submit.

---

## 👤 Traveler Reference Field (embedded list / picker) (embedded list / picker)

| id         | label       | type   | required | jweKey | tooltip              | notes              | logic               |
| ---------- | ----------- | ------ | -------- | ------ | -------------------- | ------------------ | ------------------- |
| travelerId | Traveler ID | select | ✅        | `ti`   | choose saved profile | duplicates removed | stored as UUID list |

---

## 🏨 Hotel Request Fields *(unchanged from v2.3.2)*

## Hotel Request Fields

| id | label | type | required | jweKey | tooltip | notes | logic |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| targetLocationType | Target Location Type | radio | ✅ | `lt` | Specific / General | drives Map Input mode | shows/hides radius |
| location.text | Location Input | map | ✅ | `lx` | HERE Places autocomplete | populates lat/lng | always visible |
| location.lat | Latitude | hidden | ✅ | `la` | resolved coord | hidden | auto‑set by map |
| location.lng | Longitude | hidden | ✅ | `ln` | resolved coord | hidden | auto‑set by map |
| location.radius | Search Radius (mi) | slider | ⬜ | `lr` | 1‑50 (default 10) | – | visible when `targetLocationType = general` |
| checkInDate | Check‑In Date | date | ✅ | `ci` | Planned arrival | min ≥ today | – |
| checkOutDate | Check‑Out Date | date | ✅ | `co` | Planned departure | – | must be `> checkInDate` |
| room.group\[\].roomType | Room Type | select | ⬜ | `rt` | King/Double/Suite | per‑room sub‑field | inside expandable room list |
| room.group\[\].travelerIds | Room Assignment | array | ⬜ | `rg` | traveller IDs | JSON | defaults: 1 traveller per room |
| notes | Notes | textarea | ⬜ | `nt` | Special needs / preferences | multiline | – |
| budgetGuidance | Budget Guidance | select | ⬜ | `bgh` | May prefill default | – | editable if no lock |

### Behaviour

* Single **MapLocationInput** handles *Specific* (pin) & *General* (radius circle) modes.  
* *room.group* is an array of objects accessed via dot‑notation (`room.group[0].roomType`, etc.).

---

## Flight Request Fields *(unchanged)*

| id | label | type | required | jweKey | tooltip | notes | logic |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| departureAirport | Departure Airport | airportPicker | ✅ | `da` | IATA / name | – | – |
| arrivalAirport | Arrival Airport | airportPicker | ✅ | `aa` | IATA / name | – | – |
| tripType | Trip Type | select | ✅ | `tt` | One‑Way / Round‑Trip | – | if `oneWay` hide all *Return* fields |
| flightDate | Departure Date | date | ✅ | `fd` | – | – | – |
| returnDate | Return Date | date | ✅*cond* | `fr` | Round‑trip only | – | shown when `tripType = roundTrip` |
| flightTimePrefDepart | Time Pref – Departure | select | ⬜ | `fp` | Optimise / Morning … | default Optimise | drives departure custom/specific fields |
| flightTimePrefReturn | Time Pref – Return | select | ⬜*cond* | `fpr` | Optimise / Morning … | only round‑trip | visible when `tripType = roundTrip`; drives return custom fields |
| flightTimeDepart.range.start | Depart Time Start | time | ⬜ | `ds` | custom range | – | visible when `flightTimePrefDepart = custom` |
| flightTimeDepart.range.end | Depart Time End | time | ⬜ | `de` | custom range | – | – |
| flightTimeDepart.type | Depart Time Type | select | ⬜ | `dt` | Departure vs Arrival | indicates whether range refers to take‑off or landing | pairs with depart range |
| flightTimeReturn.range.start | Return Time Start | time | ⬜*cond* | `xs` | custom range | – | visible when `flightTimePrefReturn = custom` |
| flightTimeReturn.range.end | Return Time End | time | ⬜*cond* | `xe` | custom range | – | – |
| flightTimeReturn.type | Return Time Type | select | ⬜*cond* | `xt` | Departure vs Arrival | indicates whether range refers to take‑off or landing | pairs with return range |
| specificFlightInfo | Specific Flight Info | textarea | ⬜ | `sfi` | Airline / flight \# | multiline | visible when any *Time Pref* \= specific |
| notes | Notes | textarea | ⬜ | `nt` | Alternate requests, split travellers | multiline | – |
| budgetGuidance | Budget Guidance | select | ⬜ | `bgf` | May prefill default | – | editable if no lock |

---

## Rental Car Request Fields *(unchanged)*

| id | label | type | required | jweKey | tooltip | notes | logic |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| pickupType | Pickup Location Type | select | ✅ | `pt` | Airport / Specific / General | controls map vs airport | – |
| pickup.location.text | Pickup Location | map/airportPicker | ✅ | `plx` | dynamic component | map if specific/general, airport picker if airport | – |
| pickup.location.lat | Pickup Lat | hidden | ✅ | `pla` | – | – | auto via component |
| pickup.location.lng | Pickup Lng | hidden | ✅ | `pln` | – | – | – |
| pickup.location.radius | Pickup Search Radius | slider | ⬜ | `plr` | general only | – | shown when `pickupType = general` |
| rentalStart | Pickup Date | date | ✅ | `rs` | – | – | – |
| pickupTime | Pickup Time | time | ⬜ | `ptm` | – | note if non‑airport | – |
| sameDropoff | Drop‑Off = Pickup? | checkbox | ✅ | `sd` | toggle | default checked | – |
| dropoffType | Drop‑Off Location Type | select | ✅*cond* | `dt` | when different | – | shown when `sameDropoff = false` |
| dropoff.location.text | Drop‑Off Location | map/airportPicker | ✅*cond* | `dlx` | dynamic component | follows rules of pickup | – |
| dropoff.location.lat | Drop‑Off Lat | hidden | ✅*cond* | `dla` | – | – | – |
| dropoff.location.lng | Drop‑Off Lng | hidden | ✅*cond* | `dln` | – | – | – |
| dropoff.location.radius | Drop‑Off Radius | slider | ⬜ | `dlr` | general only | – | shown when `dropoffType = general` |
| rentalEnd | Drop‑Off Date | date | ✅ | `re` | – | – | – |
| dropoffTime | Drop‑Off Time | time | ⬜ | `dtm` | – | – | shown when `pickupTime` present |
| vehicle.group\[\].travelerIds | Vehicle Assignment | array | ⬜ | `va` | traveller IDs | hidden section | expands to configure cars |
| vehicle.group\[\].primaryDriver | Primary Driver | select | ✅*cond* | `pd` | inside block | – | required per vehicle |
| notes | Notes | textarea | ⬜ | `nt` | requests like 4WD | multiline | – |
| budgetGuidance | Budget Guidance | select | ⬜ | `bgh` | May prefill default | – | editable if no lock |

---

## 📘 Global Notes

* Dot‑notation (`pickup.location.lat`) = nested object key in `blob`.
* **MapLocationInput** adapts between *specific* & *general* modes by props.
* All `jweKey`s validated ≤ 3 chars & unique, though **unused in MVP**.
* Code‑gen script creates `src/form-fields/*.json`; `fieldMap.ts` can still emit key map for Phase 2.

---

## 🔗 Referenced By

* **DynamicForm Engine** (renders & validates all sections)
* **Supabase migrations** (`requests.blob` jsonb)
* *(Phase 2)* **JWE Link Spec ≥ v3** when full‑payload links return

---

## Change Log

* **v2.3.4** — added Middle Name, Preferred Name, Secondary Email, Date of Birth, and Gender traveler fields; clarified First/Last Name tooltip.
* **v2.3.3** — phone & primaryEmail required; added `isPlaceholder`; renamed engine; clarified `jweKey` lifecycle.
* **v2.3.2** — Default Budget Guidance & Client Reference lock.
* **v2.3.1** — Map‑Input refactor, dot‑notation cleanup.
  *Earlier versions omitted.*
