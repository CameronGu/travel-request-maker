# State Management & Supabase Integration

## Environment Variables

Set these in your `.env` or deployment environment:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- **Required for Supabase features.**
- Run `pnpm exec tsx scripts/validate-env.ts` to validate env vars before build/deploy.

---

## Provider Setup (React/Next.js)

- **SSR-safe:** `src/app/layout.tsx` is a Server Component.
- **Client-only providers** (React Query, Theme) are in `src/app/ClientProviders.tsx`:

```tsx
// src/app/ClientProviders.tsx
"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "next-themes";
import React from "react";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        refetchOnWindowFocus: true,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
      mutations: { retry: 1 },
    },
  }));
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
```

- **Usage in layout.tsx:**

```tsx
import { ClientProviders } from "./ClientProviders";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
```

---

## Supabase Client & Storage Driver

- **Supabase client:**

```ts
import { getSupabaseClient } from '@/lib/supabase/client';
const supabase = getSupabaseClient();
```

- **Storage driver:**

```ts
import { getActiveDriver } from '@/lib/storage';
const driver = getActiveDriver();
```

- **Feature flag:**
  - `features.supabase` (from `src/config.ts`) controls whether Supabase or LocalDriver is used.

---

## Test & Mock Patterns

- **Unit tests:**
  - Mock `getActiveDriver`:
    ```ts
    vi.spyOn(storage, 'getActiveDriver').mockReturnValue({
      get: async () => mockData,
      set: async () => {},
    });
    ```
- **No global side effects:**
  - All drivers and clients are memoized and only instantiated on demand.
- **No env vars needed for tests** (unless testing Supabase integration directly).

---

## Real-time & Tree-shake

- **Real-time hooks** (`useRequestsRealtime`, `useTravelersRealtime`) are no-ops if `features.supabase` is false.
- **Tree-shake proof:**
  - When `features.supabase=false`, no `@supabase` code is included in the client bundle (verified via build analysis).

---

## Mock Patterns for E2E/Integration

- Use Playwright or Cypress to simulate UI and real-time updates.
- For local Supabase, use the Supabase CLI to spin up a test instance.

---

## Troubleshooting

- If you see SSR errors, ensure all hooks/providers are only used in Client Components.
- If you see build errors about Deno/Edge functions, ensure they are excluded from the main app's `tsconfig.json`.

---

## Further Reading
- [Next.js App Router: Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript)
- [TanStack Query Docs](https://tanstack.com/query/latest) 