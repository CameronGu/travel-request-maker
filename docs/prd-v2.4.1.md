# **🛠️ Migration Plan – Vanilla → React/Next.js (v2.4.1)**

**Purpose**  A beginner‑friendly checklist **you** follow *before* handing the repo to Cursor + Task‑Master. When every box is ticked, the PRD can be executed in a single run with zero missing imports or file‑not‑found errors.

---

## **✅ Quick‑Start Checklist**

| Box | Step \# | Task (high-level) |
| ----- | ----- | ----- |
| ✅ | 0 | Freeze & tag vanilla code (`v0-vanilla`) |
| ✅ | 1 | Slice `main.js` into logical 300 LOC chunks and move all vanilla code into `/legacy/` |
| ✅ | 2 | Bootstrap a fresh Next.js \+ TypeScript project using App Router |
| ✅ | 3 | Pin Node version using `.nvmrc`, initialize `pnpm`, and scaffold `.env.local.example` |
| ✅ | 4 | Add Tailwind, shadcn/ui, and migrate component styles to `@layer` in `globals.css` |
| ✅ | 5 | Install all required dependencies (zustand, TanStack Query, form libs, testing) |
| ✅ | 6 | Add ESLint \+ Prettier config with rules to catch common AI mistakes |
| ✅ | 7 | Create `config.ts` with feature flags (`offlineDrafts`, `supabase`) |
| ✅ | 8 | Scaffold `StorageDriver` system (`LocalDriver`, `SupabaseDriver`, `index.ts`) |
| ✅ | 9 | Add factory hook utility and implement `useTravelers` / `useRequests` |
| ✅ | 10 | Seed `form-fields/*.json` with 2–3 sample fields per file |
| ✅ | 11 | Add basic TypeScript interfaces for `Traveler`, `TravelRequest`, and form data |
| ✅ | 12 | Create stub for `DynamicForm.tsx` component |
| ✅ | 13 | Add Vitest setup, accessibility test config, and CI workflow file |
| ~~☐~~ | ~~14~~ | ~~Update ESLint to support import aliasing with `@/` paths~~ |
| ✅ | 15 | Add markdown table mapping legacy selectors to React components |
| ✅ | 16 | Run `pnpm build`, verify success, commit, and tag `v1-react` |
| ✅ | 17 | Add stub: `ProjectService.ts` to handle URL param parsing |
| ✅ | 18 | Add stub: `utils.ts` for Base64 encode/decode helpers |
| ✅ | 19 | Add stub: `TravelerModal.tsx` so Cursor doesn’t fail on missing modal |

---

## **🔍 Detailed Step-by-Step Instructions**

### **0️⃣ Freeze & Tag the Vanilla Code**

Create a migration-safe copy of the legacy code.

```shell
# From your vanilla project root
git checkout -b vanilla-archive
# Commit the current state
git add . && git commit -m "freeze vanilla version"
git tag v0-vanilla
```

Create a migration branch:

```shell
git checkout -b next-migration
```

### **1️⃣ Pre-Slice Legacy JS into `/legacy/`**

Break `main.js` into focused chunks (\~300 LOC max) and move all legacy files:

```
/legacy/
  ├─ main.traveler.js
  ├─ main.hotel.js
  ├─ main.tabs.js
  ├─ mainUtils.js
  ├─ travelerService.js
  ├─ main.css
  └─ index.html
```

This ensures Cursor won’t exceed GPT token limits and can selectively read relevant code.

### **2️⃣ Bootstrap the React Project**

From a clean folder:

```shell
npx create-next-app@latest travel-request-react --typescript --eslint --app
cd travel-request-react
```

### **3️⃣ Pin Node Version & Setup Env File**

Create `.nvmrc`:

```
20.11.1
```

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Use `pnpm` (v8+) for better performance:

```shell
pnpm install
```

### **4️⃣ Tailwind \+ shadcn/ui \+ Design Tokens**

Install Tailwind:

```shell
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
```

Then install shadcn/ui:

```shell
pnpm dlx shadcn-ui@latest init
```

Add Tailwind design tokens to `tailwind.config.js`:

```ts
colors: {
  primary: { DEFAULT: '#2563eb', fg: '#ffffff' },
  secondary: { DEFAULT: '#f3f4f6', fg: '#1f2937' },
  muted: '#6b7280',
  destructive: '#dc2626'
}
```

Copy component utility classes (`.btn-primary`, `.form-label`, etc.) from `main.css` into `src/app/globals.css` under `@layer components`.

### **5️⃣ Install Required Libraries**

```shell
pnpm add zustand @tanstack/react-query lucide-react @headlessui/react
pnpm add react-hook-form zod @hookform/resolvers
pnpm add -D vitest @testing-library/react @testing-library/jest-dom vitest-axe \
  eslint-plugin-import eslint-import-resolver-typescript prettier eslint-config-prettier
```

### **6️⃣ ESLint & Prettier Rules**

Add Flat-Config `eslint.config.mjs`

```javascript
extends: ["next/core-web-vitals", "plugin:import/typescript", "prettier"],
settings: { 'import/resolver': { typescript: {} } },
rules: {
  'max-lines': ['warn', { max: 300 }],
  'no-restricted-syntax': [ 'error', {
    selector: "Literal[value=/#[0-9a-f]{3,6}$/i]",
    message: 'Use Tailwind tokens instead of raw colors.'
  }]
}

“Create eslint.config.mjs (Flat Config). It must:
• import @eslint/js presets
• register eslint-plugin-import and eslint-plugin-vitest
• expose ignores: ['.next/**', 'node_modules/**']
• include max-lines (300) and raw-color guard rules
• add settings: { 'import/resolver': { typescript: true } } for alias support.”

```

### **7️⃣ Feature Flags in config.ts**

Create:

```ts
export const features = {
  offlineDrafts: false,
  supabase: false
};
```

### **8️⃣ StorageDriver System**

In `src/lib/storage/`:

* `StorageDriver.ts` – defines the `get()` and `set()` contract

* `LocalDriver.ts` – uses `localStorage` (with error handling)

* `SupabaseDriver.ts` – stub with TODO

* `index.ts` – exports `activeDriver = features.supabase ? SupabaseDriver : LocalDriver`

### **9️⃣ Hook Factory**

In `src/hooks/factory.ts`, implement:

```ts
import { activeDriver } from '@/lib/storage';
import { useQuery } from '@tanstack/react-query';
export const createHook = <T>(key: string) => () => useQuery([key], () => activeDriver.get<T>(key));
```

Use it to create `useTravelers.ts` and `useRequests.ts`.

### **🔟 Seed JSON Field Stubs**

Create directory `src/form-fields/` with:

* `fields.hotel.json`

* `fields.flight.json`

* `fields.car.json`

Each file contains 2–3 stub fields (e.g., check-in date, airport code, car type).

### **1️⃣1️⃣ Add TypeScript Interfaces**

Create `src/types/index.ts` with placeholder interfaces:

```ts
export interface Traveler { id: string; firstName: string; lastName: string; ... }
export interface TravelRequest { hotel: object; flight: object; car: object; }
export type HotelFormData = Record<string, unknown>;
export type FlightFormData = Record<string, unknown>;
export type CarFormData = Record<string, unknown>;
```

### **1️⃣2️⃣ Stub DynamicForm.tsx**

Create an empty React component in `src/components/`:

```
export default function DynamicForm() {
  return null; // TODO: hook into RHF using JSON field config
}
```

### **1️⃣3️⃣ Add Testing Setup**

* Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/extend-expect';
```

*   
  Add `.github/workflows/ci.yml` to run:

```shell
pnpm test
pnpm test:a11y
pnpm build
```

### **~~1️⃣4️⃣ ESLint Alias Resolver~~**

~~Ensure import aliasing works in ESLint:~~

```javascript
settings: { 'import/resolver': { typescript: {} } },
```

### **1️⃣5️⃣ Add Legacy Mapping Doc**

Create `docs/legacy-mapping.md` with a table mapping selectors to React components:

| Legacy ID | React Component | File Path |
| ----- | ----- | ----- |
| `#hotelForm` | `<HotelForm />` | `src/components/HotelForm.tsx` |

### **1️⃣6️⃣ First Commit & Tag React Scaffold**

```shell
pnpm build
# verify no errors

# then commit and tag
git init
pnpm install
pnpm build

# commit first version
git add . && git commit -m "feat: initial React scaffold"
git tag v1-react
```

### **1️⃣7️⃣ Add `ProjectService.ts`**

File: `src/lib/ProjectService.ts`

```ts
export const getProjectInfo = () => {
  // TODO: parse project/request info from query params
  return {};
};
```

### **1️⃣8️⃣ Add `utils.ts`**

File: `src/lib/utils.ts`

```ts
export const encode = (data: unknown) => btoa(encodeURIComponent(JSON.stringify(data)));
export const decode = <T = unknown>(str: string): T | null => {
  try {
    return JSON.parse(decodeURIComponent(atob(str)));
  } catch {
    return null;
  }
};
```

### **1️⃣9️⃣ Add `TravelerModal.tsx`**

File: `src/components/TravelerModal.tsx`

```
export default function TravelerModal() {
  return null; // TODO: modal logic for traveler management
}
```

---

## **✅ FILES TO CREATE (or stub)**

## **📁 Final Project Folder Snapshot (Before AI Work)**

```
travel-request-react/
├── .env.local.example
├── eslint.config.mjs
├── .nvmrc
├── package.json
├── pnpm-lock.yaml
├── tailwind.config.js
├── postcss.config.js
├── vitest.setup.ts
├── public/
│   └── (any static assets moved from legacy: flags/, logos/, etc.)
├── legacy/
│   ├── index.html
│   ├── main.css
│   ├── main.traveler.js
│   ├── main.hotel.js
│   ├── main.tabs.js
│   ├── travelerService.js
│   └── mainUtils.js
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   └── (app router entry files)
│   ├── components/
│   │   ├── DynamicForm.tsx
│   │   └── TravelerModal.tsx
│   ├── config.ts
│   ├── form-fields/
│   │   ├── fields.hotel.json
│   │   ├── fields.flight.json
│   │   └── fields.car.json
│   ├── hooks/
│   │   ├── factory.ts
│   │   ├── useTravelers.ts
│   │   └── useRequests.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── ProjectService.ts
│   │   └── storage/
│   │       ├── index.ts
│   │       ├── StorageDriver.ts
│   │       ├── LocalDriver.ts
│   │       └── SupabaseDriver.ts
│   └── types/
│       └── index.ts
├── .github/
│   └── workflows/
│       └── ci.yml
└── docs/
    └── legacy-mapping.md
```

Each file below is required to fully complete the migration. Prompts are optimized for generation.

### **🧱 Core Configuration & Metadata**

| File | Purpose | Prompt |
| ----- | ----- | ----- |
| `.nvmrc` | Pin Node version | `Create a file named .nvmrc containing: 20.11.1.` |
| `.env.local.example` | Supabase placeholders | `Add NEXT_PUBLIC_SUPABASE_URL= and NEXT_PUBLIC_SUPABASE_ANON_KEY=` |
| `eslint.config.mjs` | Flat-config rules & alias resolver | Create an ESM `eslint.config.mjs` that: `mjs\nimport js from '@eslint/js';\nimport pluginImport from 'eslint-plugin-import';\nimport pluginVitest from 'eslint-plugin-vitest';\n\nexport default [\n js.configs.recommended,\n {\n files: ['**/*.{js,jsx,ts,tsx}'],\n ignores: ['.next/**', 'node_modules/**'],\n plugins: { import: pluginImport, vitest: pluginVitest },\n settings: { 'import/resolver': { typescript: true } },\n rules: {\n 'max-lines': ['warn', { max: 300, skipComments: true, skipBlankLines: true }],\n 'no-restricted-syntax': ['error', { selector: \"Literal[value=/#[0-9a-f]{3,6}$/i]\", message: 'Use Tailwind tokens instead of raw colours.' }],\n 'import/order': ['warn', { groups: ['builtin','external','internal','parent','sibling','index'], 'newlines-between':'always', alphabetize:{order:'asc',caseInsensitive:true} }],\n 'import/no-unresolved': 'error',\n 'import/newline-after-import': 'warn',\n 'no-console': ['warn', { allow: ['warn','error'] }],\n },\n },\n];\n` |

### **⚙️ Storage Driver System**

| File | Purpose | Prompt |
| ----- | ----- | ----- |
| `StorageDriver.ts` | Driver interface | TypeScript interface with `get()` and `set()` methods |
| `LocalDriver.ts` | Local storage support | Uses `localStorage` with graceful error handling |
| `SupabaseDriver.ts` | Placeholder stub | Returns `undefined` or `null` with TODO comment |
| `index.ts` | Driver switcher | `export const activeDriver = features.supabase ? SupabaseDriver : LocalDriver` |

### **⚙️ Feature Flags & Hook Factory**

| File | Purpose | Prompt |
| ----- | ----- | ----- |
| `config.ts` | Feature flags | Export `{ offlineDrafts: false, supabase: false }` |
| `factory.ts` | Generic hook creator | `createHook<T>(key)` calls `activeDriver.get<T>(key)` via TanStack Query |
| `useTravelers.ts` | Traveler hook | `useQuery` on `'travelers'` key |
| `useRequests.ts` | Request hook | `useQuery` on `'requests'` key |

### **🧩 Dynamic Form System**

| File | Purpose | Prompt |
| ----- | ----- | ----- |
| `DynamicForm.tsx` | JSON-driven form | Empty component with RHF \+ zod TODO comment |

### **🗃 JSON Field Schema Stubs**

| File | Purpose | Prompt |
| ----- | ----- | ----- |
| `fields.hotel.json` | Hotel form config | Add 2–3 fields like checkIn, checkOut with required validation |
| `fields.flight.json` | Flight form config | Add departureAirport, flightDate |
| `fields.car.json` | Car rental config | Add carType, pickupLocation |

### **🧾 Type Definitions**

| File | Purpose | Prompt |
| ----- | ----- | ----- |
| `index.ts` | Interfaces | Traveler, TravelRequest, HotelFormData, etc. |

### **🔬 Testing & CI**

| File | Purpose | Prompt |
| ----- | ----- | ----- |
| `vitest.setup.ts` | Testing env | Import `@testing-library/jest-dom/extend-expect` |
| `ci.yml` | CI script | Checkout, install, test, build |

### **📄 Documentation**

| File | Purpose | Prompt |
| ----- | ----- | ----- |
| `legacy-mapping.md` | React/Legacy mapping | Table from PRD appendix |

### **🧩 Project & Modal Stubs**

| File | Purpose | Prompt |
| ----- | ----- | ----- |
| `ProjectService.ts` | Parse URL project info | Export stub `getProjectInfo()` function |
| `utils.ts` | Encode/decode helpers | Export `encode()` and `decode()` for Base64 |
| `TravelerModal.tsx` | Traveler management UI | Stub React modal component |

---

Once all steps are complete and `pnpm build` passes, commit and tag `v1-react`, then open Cursor, load the PRD, and start the automated migration. 🚀