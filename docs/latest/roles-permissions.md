# **Roles & Permissions Matrix**

**Version:** v2.1 – Supabase RLS model (May 2025)

| Role            | Scope   | Can Create Links | Can Edit Travelers | Can Add Travelers via Link   | Can View All Requests | Can Approve | Future API Key |
| --------------- | ------- | ---------------- | ------------------ | ---------------------------- | --------------------- | ----------- | -------------- |
| **attAdmin**    | Global  | ✅ any            | ✅ any              | N/A                          | ✅ all clients         | ✅           | ✅              |
| **clientAdmin** | Client  | ✅ own client     | ✅ own client       | N/A                          | ✅ own client          | ⬜ Phase 2   | ⬜              |
| **requester**   | Project | ❌                | ❌                  | ⬜ (if `allow_add_travelers`) | Only own project      | ❌           | ❌              |

---

\## 1 Storage Model

```
clients     → uuid PK
projects    → FK clients.id
travelers   → FK clients.id
links       → FK clients.id; snapshot traveler_ids[]; RLS isolates by client
requests    → FK projects.id; created_via_link_id
```

---

\## 2 Enforcement Narrative

**Primary enforcement is Supabase RLS.** Front‑end UI continues to hide/disable controls based on the `role`, `traveler_ids`, and `allow_add_travelers` columns fetched from the current **links** row. Client‑side checks are *advisory* only; all critical rules live in the database.

---

\## 3 Derived Abilities

* **Manage Travelers** → `role ∈ {attAdmin, clientAdmin}`
* **Add Travelers via Link** → `allow_add_travelers = true` **and** `role ∈ {requester, clientAdmin, attAdmin}` *(Phase 2+)*
* **Promote Request to Booking** → *future* `role = attAdmin`
* **Change Request** → requester *only for their own request*, routed via new diff link.

---

\## 4 Implementation Plan

1. **`useCurrentLink()` hook** – loads the current **links** row and exposes `role`, `travelerIds`, `allow_add_travelers`.
2. Replace legacy `<RBAC>` wrappers with a thin `hasRole()` util that consumes `role` from the hook or the Supabase session JWT.
3. Author Supabase RLS policies (see `docs/roles-permissions-v2.1.sql`) and cover with unit tests using Supabase test helpers.

---

\## 5 Phase‑2 Notes (Planned)

* Live link editing (update `links` row → instant UI refresh)
* Traveler **pools** & **tags** for rapid assignment
* One‑Time Password (OTP) links for temporary elevated access
* Time‑boxed roles (start/expiry within `links` row)
* Duplicate‑hash detection for travelers (`traveler_hash` unique per client)

---

> **Change Log**
>
> * **v2.1** – Switched from stateless JWE enforcement to Supabase RLS; introduced **links** table, minimal‑claim links, and `allow_add_travelers` flag; updated implementation plan.
> * **v2.0** – Initial stateless JWE RBAC model (deprecated).