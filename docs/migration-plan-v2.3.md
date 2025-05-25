# **🛠️ Migration Plan – Vanilla → React/Next.js (v2.3)**

**Purpose**  Follow this beginner‑friendly checklist **before** handing the repo to Cursor + Task‑Master. When every box is ticked, the PRD can be executed in a single run.

---

## **✅ Quick‑Start Checklist**

| Box | Task (high‑level) |
| ----- | ----- |
| ☐ | **0\. Freeze & tag vanilla code (`v0-vanilla`)** |
| ☐ | **1\. Pre‑slice legacy JS into `/legacy/` (≤ 300 LOC each) & commit to new repo** |
| ☐ | 2\. Bootstrap Next.js \+ TypeScript project |
| ☐ | 3\. Pin Node version & init pnpm |
| ☐ | 4\. Add Tailwind \+ shadcn/ui \+ tokens & move static assets |
| ☐ | 5\. Install core libs (zustand, TanStack Query, lucide‑react…) |
| ☐ | 6\. Set up ESLint \+ Prettier rules |
| ☐ | 7\. Create `config.ts` feature flags |
| ☐ | 8\. Implement `StorageDriver` abstraction |
| ☐ | 9\. Add hook factory (`useTravelers`/`useRequests`) |
| ☐ | 10\. Seed JSON field stubs (`/form-fields/*.json`) |
| ☐ | 11\. Add starter TypeScript interfaces (`/types/index.ts`) |
| ☐ | 12\. Stub `DynamicForm.tsx` component |
| ☐ | 13\. Add CI \+ unit & a11y tests |
| ☐ | 14\. Update ESLint import‑alias resolver |
| ☐ | 15\. Commit Vanilla→React mapping appendix |
| ☐ | **16\. Git init → first commit → tag `v1-react` & run `pnpm build` locally** |

---

## **0️⃣ Freeze & Tag Vanilla Code**

```shell
# in original vanilla repo
git checkout -b vanilla-archive
git add . && git commit -m "freeze vanilla version"
git tag v0-vanilla
# create migration branch in same repo for reference
git checkout -b next-migration
```

---

## **1️⃣ Pre‑Slice Legacy Code**

1. Create a `legacy/` folder **inside the new React repo**.2. Split `main.js` into thematic chunks **\< 300 LOC** (`main.traveler.js`, `main.hotel.js`, `main.tabs.js`, etc.).3. Copy `index.html`, `main.css`, and any other vanilla files here.4. **Commit** these slices so Cursor can read them.

---

## **2️⃣ Bootstrap Next.js \+ TS**

```shell
npx create-next-app@latest travel-request-react --typescript --eslint --app
cd travel-request-react
```

**Tip:** use **pnpm** for speed.

---

## **3️⃣ Pin Toolchain & Env**

```shell
echo "20.11.1" > .nvmrc
pnpm --version              # ensure ≥ 8
```

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## **4️⃣ Tailwind \+ shadcn/ui \+ Tokens & Static Assets**

```shell
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
pnpm dlx shadcn-ui@latest init
```

Edit `tailwind.config.js` to include semantic colors:

```javascript
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', fg: '#ffffff' },
        secondary: { DEFAULT: '#f3f4f6', fg: '#1f2937' },
        muted: '#6b7280',
        destructive: '#dc2626'
      }
    }
  }
}
```

*Move* any static assets (`flags/`, images) from the vanilla project into `/public/` and copy utility classes from `legacy/main.css` into `src/app/globals.css` (`@layer components`).

---

## **5️⃣ Install Core Libraries**

```shell
pnpm add zustand @tanstack/react-query lucide-react @headlessui/react
pnpm add react-hook-form zod @hookform/resolvers
pnpm add -D vitest @testing-library/react @testing-library/jest-dom vitest-axe eslint-plugin-import eslint-import-resolver-typescript prettier eslint-config-prettier
```

---

## **6️⃣ ESLint \+ Prettier Rules**

Create/extend `.eslintrc.cjs`:

```javascript
extends: ["next/core-web-vitals", "plugin:import/typescript", "prettier"],
settings: { 'import/resolver': { typescript: {} } },
rules: {
  'max-lines': ['warn', { max: 300 }],
  'no-restricted-syntax': [ 'error', { selector: "Literal[value=/#[0-9a-f]{3,6}$/i]", message: 'Use Tailwind tokens instead of raw colors.' } ]
}
```

---

## **7️⃣ Feature Flags**

`src/config.ts`:

```ts
export const features = { offlineDrafts:false, supabase:false };
```

---

## **8️⃣ StorageDriver Abstraction**

```
src/lib/storage/StorageDriver.ts
src/lib/storage/LocalDriver.ts
src/lib/storage/SupabaseDriver.ts   // empty stub
src/lib/storage/index.ts            // exports activeDriver
```

Template:

```ts
export interface StorageDriver { get<T>(key:string):Promise<T|null>; set<T>(key:string,val:T):Promise<void>; }
```

---

## **9️⃣ Hook Factory**

`src/hooks/factory.ts`:

```ts
import { activeDriver } from '@/lib/storage';
import { useQuery } from '@tanstack/react-query';
export const createHook = <T>(key:string) => () => useQuery([key], () => activeDriver.get<T>(key));
```

Implement `useTravelers`, `useRequests` via factory.

---

## **🔟 Seed JSON Field Stubs**

Create directory `src/form-fields/` with:

```
fields.hotel.json
fields.flight.json
fields.car.json
```

Each file *must* contain **2–3 sample fields**:

```json
[
  { "name": "checkIn", "label": "Check‑in Date", "type": "date", "validation": { "required": true } }
]
```

Commit these stubs.

---

## **1️⃣1️⃣ Starter TypeScript Interfaces**

`src/types/index.ts` contains `Traveler`, `TravelRequest`, and `Hotel/Flight/CarFormData` (placeholders to be refined).

---

## **1️⃣2️⃣ Stub DynamicForm Component**

`src/components/DynamicForm.tsx` → `export default () => null;`

---

## **1️⃣3️⃣ Continuous Integration & Tests**

1. `vitest.setup.ts` → `import '@testing-library/jest-dom/extend-expect';`

2. Add script: `"test:a11y":"vitest run src/**/*.test.ts --environment jsdom"`

3. `.github/workflows/ci.yml` runs install → unit tests → a11y tests → build.

---

## **1️⃣4️⃣ Vanilla→React Mapping Appendix**

Add `docs/legacy-mapping.md` with selector → component table (copy from PRD appendix).

---

## **1️⃣5️⃣ Git Init & First Commit in React Repo**

```shell
cd travel-request-react
git init
git remote add origin <your-repo-url>
git add .
git commit -m "feat: initial React scaffold"
```

Run local build once:

```shell
pnpm build
```

Tag first React snapshot:

```shell
git tag v1-react
```

---

## **🏁 One‑Shot Readiness Checklist**

*(Copy the Quick‑Start table here and tick each item as you complete it.)*

**All boxes ticked?** ➜ Open Cursor, load the PRD, run Task‑Master, enjoy automated migration\! 🌟

