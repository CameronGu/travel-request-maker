# **Admin UI Wireframes – Local‑Only Model**

**Version:** v2.3 — synced with **form‑specs v2.3.1** & **JWE Spec v2.1** (May 2025)

> **Scope** Local‑only, stateless tooling for ATT & Client Admins to generate scoped share links that pre‑populate *Shared Metadata* fields (`client`, `project`, `defaultBudgetGuidance.*`, `clientReference`) and embed RBAC claims (`role`, `exp`).

---

## **1 Admin Home (ATT Admin Only)**

```
┌───────────────────────────────┐
│   Admin Link Generator       │
├──────────────────────────────┤
│ +  New Client Link           │
│ +  New Project Link (Manual) │
└──────────────────────────────┘
```

* ATT Admins create share links for **client admins** or **requesters**.
* No historical persistence (localStorage only).

---

## **2 Link Generator Modal**

```
Generate Share Link

Role (inferred):   [ attAdmin | clientAdmin | requester ]
Scope (inferred):  [ Client | Project ]

Client Name ✱       [ Acme Corp              ]
Project Name         [ 2025‑06 Onboarding     ]  (optional)

Expiry ✱            [ 30 days ▾ ]            (ISO timestamp for `exp`)

— Defaults Embedded in Link —
Default Budget Guidance ▶
   • Hotel  ▸  [ Optimize for Value ▾ ]
   • Flight ▸  [ Lowest Logical Fare ▾ ]
   • Car    ▸  [ Mid‑range            ▾ ]

Client Reference     [ e.g. PO‑12345 ]  (optional)
[ ] Lock for requester  ⓘ (makes field read‑only in the form)

[ Copy Link ]   [ Cancel ]
```

* **Default Budget Guidance** now contains one dropdown per request type, mirroring the `budgetGuidance.*` fields in form‑specs.  These values pre‑populate the corresponding form section but remain editable unless locked by role logic inside the Request Maker.
* **Client Reference** (`cr`) may be locked for the requester by ticking *Lock for requester*.  When locked, the value is encoded inside the link and rendered read‑only in the forms.
* Other behaviour unchanged.

---

## **3 Client Admin Dashboard** *(via link)*

```
Welcome, Acme Corp

+  New Project Link (Project Only)
+  New Project Link (Project + Client Reference)
   ↓
[ View Generated Project Links ]

Role: clientAdmin   •   Scope: Acme Corp
```

* **Project‑Only** link populates `project` but leaves `clientReference` empty & editable.
* **Project + Client Reference** opens a small modal to set `clientReference` and decide whether to *Lock for requester*.
* Dashboard retains controls to update **default Budget Guidance** & **Branding Metadata** for the client.

---

## **4 Traveller Manager** (unchanged)

```
Your Travelers              🔍  + Add
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Name     | Email        | Actions ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Jane Doe | jane@—       | ✎  ✖   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

* Local‑only storage per browser instance.
* No shared traveler list.

---

## **5 Navigation Flow**

```
ATT Admin → Admin Home
   ↓ generate     ↘ scope = client / project
JWE Link  (role: clientAdmin)  → Client Admin Dashboard
   ↓ generate     ↘  scope = project
JWE Link  (role: requester)    → Request Maker (pre‑filled metadata)
```

---

### **Changelog v2.3**

* **Default Budget Guidance** split into per‑form sub‑fields; aligns with `budgetGuidance.hotel`, `budgetGuidance.flight`, `budgetGuidance.car`, … in form‑specs.
* Added **Lock for requester** option for *Client Reference*; dashboard now supports links with or without locked reference.
* Updated copy/examples; removed single Budget Guidance dropdown.
* Minor text polish and section name tweaks.

---

**End of wireframes**
