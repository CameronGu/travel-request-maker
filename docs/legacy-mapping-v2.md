# Legacy → React Mapping

This document maps legacy DOM selectors and vanilla-JS helpers to their modern React/TypeScript counterparts. Extend this table as additional slices are migrated.

| Legacy ID / Function            | React Component / Utility            | New File Path                                        | Status              |
| ------------------------------- | ------------------------------------ | ---------------------------------------------------- | ------------------- |
| `#hotelForm`                    | `<HotelForm />`                      | `src/components/HotelForm.tsx`                       | **stub – to build** |
| `#flightForm`                   | `<FlightForm />`                     | `src/components/FlightForm.tsx`                      | **stub – to build** |
| `#carForm`                      | `<CarForm />`                        | `src/components/CarForm.tsx`                         | **stub – to build** |
| `#travelerModalContainer`       | `<TravelerModal />`                  | `src/components/TravelerModal.tsx`                   | **stub created**    |
| `#summary`                      | `<SummaryCard />`                    | `src/components/SummaryCard.tsx`                     | **planned**         |
| `#copyBtn`, `copyToClipboard()` | `CopyButton`, `copyToClipboard`      | `src/components/CopyButton.tsx`, `src/lib/utils.ts`  | **planned**         |
| `#shareBtn`, `shareRequest()`   | `ShareButton`, `shareRequest`        | `src/components/ShareButton.tsx`, `src/lib/utils.ts` | **planned**         |
| `#hotelTravelerSelector`        | `<TravelerSelector form="hotel" />`  | `src/components/TravelerSelector.tsx`                | **planned**         |
| `#flightTravelerSelector`       | `<TravelerSelector form="flight" />` | `src/components/TravelerSelector.tsx`                | **planned**         |
| `#carTravelerSelector`          | `<TravelerSelector form="car" />`    | `src/components/TravelerSelector.tsx`                | **planned**         |
| `serializeForm()`               | `serializeForm`                      | `src/lib/formUtils.ts`                               | **planned**         |
| `deserializeForm()`             | `deserializeForm`                    | `src/lib/formUtils.ts`                               | **planned**         |
| `validatePhoneNumber()`         | `validatePhoneNumber`                | `src/lib/utils.ts`                                   | **migrated**        |
| `formatPhoneForStorage()`       | `formatPhoneForStorage`              | `src/lib/utils.ts`                                   | **migrated**        |
| `getTravelerDisplayName()`      | `getTravelerDisplayName`             | `src/lib/utils.ts`                                   | **migrated**        |
| `TravelerService`               | `TravelerService` (hook/driver)      | `src/lib/services/TravelerService.ts`                | **slice exists**    |

> **Next steps**
>
> * Create the three form components as thin wrappers around `<DynamicForm>`.
> * Implement `formUtils.ts` with helpers adapted for `react-hook-form`.
> * Refactor `TravelerService` into a pluggable service using the StorageDriver pattern.
> * Update this table whenever a new selector/function is migrated.
