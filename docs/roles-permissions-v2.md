# **Roles & Permissions Matrix** 

**Version:** v2.0

| Role | Scope | Can Create Links | Can Edit Travelers | Can View All Requests | Can Approve | Future API Key |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |  |

| attAdmin | Global | ✅ any client/project | ✅ any | ✅ | ✅ | ✅ |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| **clientAdmin** |  Client | ✅ for own client | ✅ for own client | ✅ (own client) | ⬜ (phase 2\) | ⬜ |
| **requester** |  Project | Only for own project | ❌ | Only own project | ❌ | ❌ |

---

## **1  Storage Model**

```
travelers   → keyed by UUID, clientId
projects    → clientId : project[]
requests    → projectId : request[]
linkClaims  → decoded from JWE, *not* persisted (stateless)
```

*Permissions are **enforced client‑side** using the full decoded payload in the JWE link. No external lookup or cached datasets are required for authorization.*

---

## **2  Derived Abilities**

* **Manage Travelers** → `role ∈ {attAdmin, clientAdmin}`

* **Promote Request to Booking** → *future* `role = attAdmin`

* **Change Request** → requester *only for their own request*, routed via new diff link.

---

## **3  Implementation Plan**

1. Add `role` to decoded JWE claims and export `useRole()` hook.

2. Create `<RBAC>` component that shows/hides children by `allowed` prop (array of roles).

3. Refactor existing pages to wrap protected blocks in `<RBAC allowed={["attAdmin"]}>`.

4. **Unit tests** in `roles.test.ts` ensure every feature flag \= false path is covered.

---

