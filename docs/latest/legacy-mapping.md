# Legacy → React Mapping

**v2.2 – Supabase MVP alignment (2025‑05‑28)**

This table tracks how each legacy DOM selector, vanilla‑JS helper, or route is translated into the new **Next.js 15 + Supabase** codebase described in **PRD v3.1.1** and **admin‑ui‑wireframes v3.1‑mvp**.

*Rows marked **stub** must be created; **planned** exist as a TODO; **ready** are functionally complete.*

## Component & Utility Mapping

| Legacy ID / Function            | React Component / Utility                   | New File Path                                       | Status              |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------- | ------------------- |
| `#hotelForm`                    | `<DynamicForm section="Hotel" />`           | `src/components/DynamicForm.tsx`                    | **stub – to build** |
| `#flightForm`                   | `<DynamicForm section="Flight" />`          | `src/components/DynamicForm.tsx`                    | **stub – to build** |
| `#carForm`                      | `<DynamicForm section="Car" />`             | `src/components/DynamicForm.tsx`                    | **stub – to build** |
| *(none – new)*                  | `<RequestQueue />`                          | `src/components/RequestQueue.tsx`                   | **stub – to build** |
| *(none – new)*                  | `<ShareLinkModal />`                        | `src/components/ShareLinkModal.tsx`                 | **stub – to build** |
| *(none – new)*                  | `<LinksTab />`                              | `src/components/LinksTab.tsx`                       | **stub – to build** |
| *(none – new)*                  | `<TravelerDirectory />`                     | `src/components/TravelerDirectory.tsx`              | **stub – to build** |
| *(none – new)*                  | `<AdminDashboard />`                        | `src/components/AdminDashboard.tsx`                 | **stub – to build** |
| `#travelerModalContainer`       | `<TravelerModal />`                         | `src/components/TravelerModal.tsx`                  | **stub created**    |
| `#summary`                      | `<SummaryCard />`                           | `src/components/SummaryCard.tsx`                    | **planned**         |
| `#copyBtn`, `copyToClipboard()` | `CopyButton`, `copyToClipboard`             | `src/components/CopyButton.tsx`, `src/lib/utils.ts` | **planned**         |
| `#shareBtn`, `shareRequest()`   | **deprecated** – replaced by ShareLinkModal | –                                                   | **removed**         |
| `#hotelTravelerSelector`        | `<TravelerSelector form="hotel" />`         | `src/components/TravelerSelector.tsx`               | **planned**         |
| `#flightTravelerSelector`       | `<TravelerSelector form="flight" />`        | `src/components/TravelerSelector.tsx`               | **planned**         |
| `#carTravelerSelector`          | `<TravelerSelector form="car" />`           | `src/components/TravelerSelector.tsx`               | **planned**         |
| `serializeForm()`               | `serializeForm`                             | `src/lib/formUtils.ts`                              | **planned**         |
| `deserializeForm()`             | `deserializeForm`                           | `src/lib/formUtils.ts`                              | **planned**         |
| `validatePhoneNumber()`         | `validatePhoneNumber`                       | `src/lib/utils.ts`                                  | **stub – to build** |
| `formatPhoneForStorage()`       | `formatPhoneForStorage`                     | `src/lib/utils.ts`                                  | **stub – to build** |
| `getTravelerDisplayName()`      | `getTravelerDisplayName`                    | `src/lib/utils.ts`                                  | **stub – to build** |
| `TravelerService`               | `TravelerService` (hook/driver)             | `src/lib/services/TravelerService.ts`               | **slice exists**    |

> **Removed rows** – `#linkForm` and any placeholder‑traveler hacks have been fully replaced by first‑class Supabase rows and ShareLinkModal.

## Route Mapping

| Legacy Path       | New Route                           | Notes                        |
| ----------------- | ----------------------------------- | ---------------------------- |
| `/travelers`      | `/traveler-directory`               | ATT & Client scoped          |
| `/link-generator` | `/admin/projects/[id]/link` (modal) | generator replaced           |
| *(none)*          | `/admin`                            | ATT admin landing            |
| *(none)*          | `/client`                           | Client admin landing         |
| *(none)*          | `/requests`                         | Request Queue for requesters |
| *(none)*          | `/links/:id`                        | Public slug for link landing |

## Version History

| Ver     | Date       | Notes                                                                                                  |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| **2.2** | 2025‑05‑28 | Supabase MVP alignment, DynamicForm rename, Links & RequestQueue added, legacy link‑generator removed. |
| 2.1     | 2025‑04‑?? | Initial mapping draft.                                                                                 |